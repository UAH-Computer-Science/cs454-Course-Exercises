# Appendix — Working Behind a Restricted Network

Some of these exercises create a local virtual machine or pull container images
from the internet. On a personal machine at home that usually just works. On a
managed laptop with a corporate VPN or endpoint-security agent, it often does
not.

This page exists because the failure is confusing rather than difficult. The
error messages point at Ubuntu's package mirrors, which are almost never the
actual problem.

> Throughout this page, `192.168.252.x` is the VM subnet and `enp0s1` is the
> VM's interface. Both differ between machines. Substitute the values your own
> VM reports from `ip addr` and `ip route`.

## Symptoms

Any of these, typically in Exercise 02 step 3 or Exercise 03/04 image pulls:

```text
Could not connect to ports.ubuntu.com:80 (91.189.91.103). - connect (111: Connection refused)
```

```text
curl: (6) Could not resolve host: ports.ubuntu.com
```

```text
E: Unable to locate package nodejs
```

The last one is a consequence, not a cause: `apt-get update` failed, so the
package index is empty, so apt cannot find a package that exists.

## Diagnose before you change anything

Work outward from the VM. Each step tells you whether the next one is worth
running. Run these **inside** the VM (`multipass shell cs454-vm`):

```bash
ip addr show | grep -E 'inet |state '   # does the VM have an address and a link?
ip route                                # is there a default route, and via what?
ping -c2 -W2 1.1.1.1                    # raw IPv4 egress, no DNS involved
resolvectl query ports.ubuntu.com       # name resolution through the configured resolver
dig +short @1.1.1.1 ports.ubuntu.com    # name resolution bypassing it
curl -sS -m 5 -o /dev/null -w '%{http_code}\n' http://1.1.1.1/   # TCP, no DNS
```

Read the results as a table:

| Observation | Meaning | Go to |
| --- | --- | --- |
| No address on the interface | Lost DHCP lease | [Link](#no-address) |
| `ping 1.1.1.1` fails | No egress at all | [Routing](#no-egress) |
| `dig @1.1.1.1` works, `resolvectl query` does not | Only DNS is broken | [DNS](#dns) |
| DNS works, `curl http://1.1.1.1/` refused in a few ms | TCP is being rejected locally | [Proxy](#proxy) |

That last row is the important one. A refusal in **under ~20 ms** to a host
hundreds of milliseconds away means no packet ever left your laptop. Something
local sent a TCP reset. Compare the latency of a successful `ping` to the time
in curl's error message — if the refusal is far faster than the round trip, the
reject is local.

Also note that a VM gateway that ignores `ping` is normal. macOS `vmnet`
filters ICMP to the gateway address, so a failed gateway ping proves nothing on
its own.

<a name="no-address"></a>

## The VM has no address

```bash
sudo dhclient -r && sudo dhclient
```

If that does not help, restart the machine from the host, which rebuilds the
virtual network:

```bash
multipass stop cs454-vm && multipass start cs454-vm
```

<a name="no-egress"></a>

## No egress at all

If `ping 1.1.1.1` fails but the VM has an address and a default route, the
host's NAT is not forwarding. The usual cause is a VPN client that has claimed
the default route. Disconnect it and retry the same ping.

<a name="dns"></a>

## Only DNS is broken

DHCP hands the VM the host-side gateway as its resolver. That gateway relays to
whatever the host uses — and a VPN's resolver frequently refuses queries that
arrive from the VM subnet rather than from the host itself. Lookups then die
there while everything else works.

Point the VM at a public resolver instead:

```bash
sudo mkdir -p /etc/systemd/resolved.conf.d
sudo tee /etc/systemd/resolved.conf.d/override.conf >/dev/null <<'CONF'
[Resolve]
DNS=1.1.1.1 8.8.8.8
CONF
sudo netplan set network.ethernets.enp0s1.dhcp4-overrides.use-dns=false
sudo netplan apply
sudo systemctl restart systemd-resolved
resolvectl query ports.ubuntu.com
```

The `netplan set` line matters. Without it, the next DHCP lease renewal
reinstalls the broken resolver and the problem returns an hour later.

Multipass VMs generally have no working IPv6 route, so every lookup that
returns AAAA records costs apt a long timeout per address. Skip them:

```bash
sudo tee /etc/apt/apt.conf.d/99force-ipv4 >/dev/null <<<'Acquire::ForceIPv4 "true";'
```

<a name="proxy"></a>

## All TCP is refused: proxy through the host

This is the case where the endpoint-security agent on the host rejects TCP that
originates from the VM's address, while permitting the same traffic from a host
process. You can confirm the shape of it on the **host**:

```bash
netstat -rn -f inet | head -20
```

Large CIDR blocks (`1/8`, `2/7`, `4/6`, `8/5`, …) routed to a `utun`
interface mean a client has captured most of public IPv4 into a tunnel.

Nothing you change inside the VM fixes this. The workaround is to let the VM
borrow the host's permitted network position by running an HTTP proxy on the
host — the outbound connection then originates from a host process, which the
agent allows.

On the host (macOS/Homebrew shown; `apt install tinyproxy` on Linux):

```bash
brew install tinyproxy
tee -a /opt/homebrew/etc/tinyproxy/tinyproxy.conf <<'CONF'
Allow 192.168.252.0/24
CONF
brew services start tinyproxy
```

The stock config already sets `Port 8888` and has no `Listen` line, so it binds
every interface. The only required change is allowing the VM subnet, because
the defaults permit localhost only.

Verify on the host first, then from the VM:

```bash
lsof -nP -iTCP:8888 -sTCP:LISTEN
curl -sS -m 10 -x http://127.0.0.1:8888 -o /dev/null -w 'host=%{http_code}\n' http://ports.ubuntu.com/ubuntu-ports/dists/noble/Release
```

```bash
multipass exec cs454-vm -- curl -sS -m 5 -x http://192.168.252.1:8888 \
  -o /dev/null -w 'vm=%{http_code}\n' \
  http://ports.ubuntu.com/ubuntu-ports/dists/noble/Release
```

Accept the macOS firewall prompt if one appears.

Use the **gateway address** (`192.168.252.1`) rather than the host's LAN
address. Both usually work, but the LAN address is a DHCP lease that will move
and silently break this configuration later.

### Point apt at the proxy

```bash
sudo tee /etc/apt/apt.conf.d/99proxy >/dev/null <<'CONF'
Acquire::http::Proxy "http://192.168.252.1:8888";
Acquire::https::Proxy "http://192.168.252.1:8888";
CONF
sudo apt-get update
sudo apt-get install -y nodejs
```

Both lines are needed. A `https://` source ignores the `http` proxy setting.

### Point cloud-init at the proxy

Exercise 02 step 6 destroys the VM and rebuilds it, so a hand-written
`99proxy` file disappears with it. A fresh VM runs apt during boot with no
shell available to debug in. Add this to your local copy of `cloud-init.yaml`:

```yaml
apt:
  proxy: http://192.168.252.1:8888
```

Because the proxy address is specific to your machine, keep it out of the
committed file. Copy it instead, and launch from the copy:

```bash
cp cloud-init.yaml cloud-init.local.yaml   # then add the apt: block to the copy
multipass launch 24.04 --name cs454-vm --cpus 2 --memory 2G --disk 8G \
  --cloud-init cloud-init.local.yaml
```

`cloud-init.local.yaml` is listed in `.gitignore`.

Note that the VM needs no DNS fix for this to work. With an HTTP proxy
configured, the proxy resolves the mirror hostname on the host side, so apt
never issues a lookup of its own.

### When HTTPS fails with an untrusted certificate

An agent that inspects TLS re-signs every HTTPS connection with its own root
certificate authority. The host trusts that root because it was installed by
your IT department; a freshly created VM does not, so apt and curl reject the
connection.

The quickest answer for apt is to stop using HTTPS. Package integrity does not
depend on it — apt verifies GPG signatures on every index and package
regardless of transport, so HTTPS protects only the privacy of which packages
you fetch:

```bash
sudo sed -i 's|https://ports.ubuntu.com|http://ports.ubuntu.com|' /etc/apt/sources.list.d/ubuntu.sources
sudo apt-get update
```

For anything that genuinely requires HTTPS, install the inspecting root into
the VM's trust store. On the host:

```bash
security find-certificate -a -p /Library/Keychains/System.keychain > /tmp/corp-roots.pem
multipass transfer /tmp/corp-roots.pem cs454-vm:/tmp/
```

In the VM:

```bash
sudo cp /tmp/corp-roots.pem /usr/local/share/ca-certificates/corp-roots.crt
sudo update-ca-certificates
```

If `update-ca-certificates` rejects the combined bundle, split it into one file
per certificate first:

```bash
sudo awk '/BEGIN CERT/{n++} n{print > ("/usr/local/share/ca-certificates/corp-" n ".crt")}' /tmp/corp-roots.pem
sudo update-ca-certificates
```

Worth naming plainly: you are choosing to trust a party that can read your
encrypted traffic. On a managed laptop that decision was already made for you
at the host level. Do not carry this certificate onto machines outside that
administrative boundary.

### Point Docker at the proxy

Only needed when the Docker daemon itself runs inside a restricted VM. Docker
does not read apt's configuration:

```bash
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo tee /etc/systemd/system/docker.service.d/proxy.conf >/dev/null <<'CONF'
[Service]
Environment="HTTP_PROXY=http://192.168.252.1:8888"
Environment="HTTPS_PROXY=http://192.168.252.1:8888"
Environment="NO_PROXY=localhost,127.0.0.1,192.168.252.0/24"
CONF
sudo systemctl daemon-reload && sudo systemctl restart docker
```

## Fallback: install Node without apt

If the network keeps fighting you and you only need Exercise 02 finished,
bypass the VM's network entirely. `multipass transfer` moves files through the
Multipass daemon on the host, not over the VM's TCP stack, so it works even
when nothing else does.

On the host (use `-arm64` on Apple Silicon, `-x64` on Intel):

```bash
curl -LO https://nodejs.org/dist/v20.18.1/node-v20.18.1-linux-arm64.tar.xz
multipass transfer node-v20.18.1-linux-arm64.tar.xz cs454-vm:/tmp/
```

In the VM:

```bash
sudo tar -xJf /tmp/node-v20.18.1-linux-arm64.tar.xz -C /opt
sudo ln -sf /opt/node-v20.18.1-linux-arm64/bin/node /usr/local/bin/node
node --version
```

Exercise 02 steps 3 through 5 then work as written. Calling the service from
the host with `curl http://VM_IP_ADDRESS:3000` is host-to-VM traffic and does
not cross the blocked path.

## Why this is worth understanding

Debugging this is not a detour from the course. It is the same problem cloud
infrastructure solves, seen from the inside:

- **A VM on a private network cannot reach the internet by itself.** It needs
  something with a permitted network position to make connections on its
  behalf. That is exactly what a NAT gateway does for instances in a private
  subnet, and what an egress proxy does in networks that require inspected
  traffic.
- **Name resolution is a separate failure domain from routing.** DNS working
  and packets flowing are independent, which is why cloud providers expose VPC
  DNS settings separately from route tables.
- **Three lifecycles, again.** Is the machine running, is the OS configured
  correctly, is the application process up? Exercise 02 raises that question,
  and a broken resolver is a clean example of the middle layer failing while
  the other two are fine.
- **Inspected egress has a cost.** Terminating and re-signing TLS means
  every machine behind the proxy must be told whom to trust. That is a real
  operational burden, and it is why cloud egress designs tend to prefer NAT
  gateways over inspecting proxies unless inspection is a requirement.
- **Configuration has to survive recreation.** A fix typed into a shell is lost
  the moment the VM is rebuilt. A fix in `cloud-init.yaml` is not. That is the
  difference between administration and infrastructure as code.
