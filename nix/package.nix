{
  self,
  lib,
  stdenvNoCC,
  nodejs,
  pnpm_10,
  makeWrapper,
  electron,
  xdg-utils,
  yt-dlp,
  ...
}: let
  fs = lib.fileset;
in
  stdenvNoCC.mkDerivation (finalAttrs: {
    pname = "vermilion";
    version =
      if (self ? rev)
      then (builtins.substring 0 7 self.rev)
      else "dirty";

    src = let
      sp = ../.;
    in
      fs.toSource {
        root = sp;

        # Filter everything outside of what's specified here. Configuration files
        # are good to include, but linter/formatter configs are not necessary.
        fileset = fs.intersection (fs.fromSource (lib.sources.cleanSource sp)) (
          fs.unions [
            ../build
            ../resources
            ../src
            ../package.json
            ../pnpm-lock.yaml
            ../svelte.config.mjs
            ../electron-builder.yml
            ../electron.vite.config.ts
            ../tsconfig.json
            ../tsconfig.node.json
            ../tsconfig.web.json
          ]
        );
      };

    pnpmDeps = pnpm_10.fetchDeps {
      inherit (finalAttrs) pname src;
      hash = "sha256-DYNJl2eBrgWGu9fQ5dOI5PIST4hhJAy6CQXS0IH8Wfg=";
    };

    nativeBuildInputs = [
      makeWrapper
      pnpm_10.configHook
      nodejs
    ];

    # npm install will error when electron tries to download its binary
    # we don't need it anyways since we wrap the program with our nixpkgs electron
    env.ELECTRON_SKIP_BINARY_DOWNLOAD = "1";

    buildPhase = ''
      runHook preBuild

      cp -r ${electron.dist} electron-dist
      chmod -R u+w electron-dist # for possible Darwin support in the future

      pnpm run build
      pnpm exec electron-builder \
        --dir \
        -c.electronDist=electron-dist \
        -c.electronVersion="${electron.version}" \

      runHook postBuild
    '';

    # This is, by far, the most stupid way of packaging an application. Not my fault though
    # because Electron is stupid. The method employed here is easier (and cheaper) than
    # building the appimage, then making Nix aware of it, AND then unpacking it. You will
    # *never* catch me unpacking an appimage again.
    # - raf
    installPhase = let
      binPath = lib.makeBinPath [
        # For Electron & file pickers
        xdg-utils

        # For YT-Music integration
        # https://github.com/vaxerski/Vermilion/blob/main/docs/YTM.md
        yt-dlp
      ];
    in ''
      runHook preInstall

      mkdir -p $out/share/vermilion
      cp -r dist/*-unpacked/{locales,resources{,.pak}} $out/share/vermilion

      makeWrapper '${lib.getExe electron}' "$out/bin/vermilion" \
        --inherit-argv0 \
        --add-flags $out/share/vermilion/resources/app.asar \
        --suffix PATH : "${binPath}" \
        --add-flags "\''${NIXOS_OZONE_WL:+\''${WAYLAND_DISPLAY:+--ozone-platform-hint=auto --enable-features=WaylandWindowDecorations --enable-wayland-ime=true}}"

      runHook postInstall
    '';

    meta = {
      description = "Clean, minimal and simple music player for MPD and Tidal";
      homepage = "https://github.com/vaxerski/vermilion";
      license = lib.licenses.bsd3;
      maintainers = [lib.maintainers.NotAShelf];
      platforms = lib.platforms.linux;
    };
  })
