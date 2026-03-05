# Releasing

## Automated Releases (GitHub Actions)

Pushing a version tag triggers the full release pipeline:

```bash
git tag v0.1.0
git push origin v0.1.0
```

This will:
1. Create a **draft** GitHub Release with auto-generated release notes
2. Build the **Tauri desktop app** for macOS (Intel + Apple Silicon), Windows, and Linux
3. Build the **`idm` CLI** for macOS (Intel + Apple Silicon), Windows, and Linux
4. Upload all artifacts to the release
5. **Publish** the release once all builds succeed

### Artifacts produced

| Platform | Tauri App | CLI |
|----------|-----------|-----|
| macOS (Apple Silicon) | `.dmg` | `idm-v*-aarch64-apple-darwin.tar.gz` |
| macOS (Intel) | `.dmg` | `idm-v*-x86_64-apple-darwin.tar.gz` |
| Windows | `.msi` | `idm-v*-x86_64-pc-windows-msvc.zip` |
| Linux | `.AppImage`, `.deb` | `idm-v*-x86_64-unknown-linux-gnu.tar.gz` |

## CI

Pull requests to `main` automatically run:
- `cargo test` in `rust-cli/`
- `cargo clippy` lint checks
- Frontend build (`bun install && bun run build`)

---

## Publishing the CLI

### crates.io

```bash
cargo login  # one-time, needs API token from https://crates.io/settings/tokens
cd rust-cli
cargo publish
```

### Homebrew

1. Create a tap repo: `srsholmes/homebrew-tap`
2. Add a formula `Formula/idm.rb`:

```ruby
class Idm < Formula
  desc "CLI client for iDotMatrix LED displays over BLE"
  homepage "https://github.com/srsholmes/idotmatrix-client"
  version "0.1.0"

  on_macos do
    on_arm do
      url "https://github.com/srsholmes/idotmatrix-client/releases/download/v#{version}/idm-v#{version}-aarch64-apple-darwin.tar.gz"
      sha256 "REPLACE_WITH_SHA256"
    end
    on_intel do
      url "https://github.com/srsholmes/idotmatrix-client/releases/download/v#{version}/idm-v#{version}-x86_64-apple-darwin.tar.gz"
      sha256 "REPLACE_WITH_SHA256"
    end
  end

  on_linux do
    url "https://github.com/srsholmes/idotmatrix-client/releases/download/v#{version}/idm-v#{version}-x86_64-unknown-linux-gnu.tar.gz"
    sha256 "REPLACE_WITH_SHA256"
  end

  def install
    bin.install "idm"
  end

  test do
    system "#{bin}/idm", "--help"
  end
end
```

Users install with:
```bash
brew tap srsholmes/tap
brew install idm
```

### AUR (Arch Linux)

Example `PKGBUILD`:

```bash
pkgname=idm-bin
pkgver=0.1.0
pkgrel=1
pkgdesc="CLI client for iDotMatrix LED displays over BLE"
arch=('x86_64')
url="https://github.com/srsholmes/idotmatrix-client"
license=('MIT')
source=("https://github.com/srsholmes/idotmatrix-client/releases/download/v${pkgver}/idm-v${pkgver}-x86_64-unknown-linux-gnu.tar.gz")
sha256sums=('REPLACE_WITH_SHA256')

package() {
  install -Dm755 idm "$pkgdir/usr/bin/idm"
}
```

### npm (optional)

You could create an npm wrapper package that downloads the correct binary for the platform on `postinstall`. This is optional and more complex to maintain.

## Version Bumping

Before tagging a release, update versions in:
- `rust-cli/Cargo.toml` (`version`)
- `src-tauri/Cargo.toml` (`version`)
- `src-tauri/tauri.conf.json` (`version`)
- `package.json` (`version`)
