{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs?ref=nixos-unstable";

  outputs = {
    nixpkgs,
    self,
    ...
  }: let
    inherit (nixpkgs) legacyPackages lib;

    # Compose for multiple systems. Please do not replace this with nix-systems as it is
    # not guaranteed to build on platforms we haven't tested on.
    systems = ["x86_64-linux"];
    forEachSystem = lib.genAttrs systems;
    pkgsForEach = legacyPackages;
  in {
    # Provide a formatter for `nix fmt`
    formatter = forEachSystem (system: nixpkgs.legacyPackages.${system}.alejandra);

    packages = forEachSystem (system: let
      pkgs = pkgsForEach.${system};
    in {
      default = self.packages.${system}.vermilion;
      vermilion = pkgs.callPackage ./nix/package.nix {inherit self;};
    });

    devShells = forEachSystem (system: let
      pkgs = pkgsForEach.${system};
    in {
      default = self.devShells.${system}.vermilion;
      vermilion = pkgs.mkShellNoCC {
        name = "vermilion-dev";
        packages = with pkgs; [
          # Eslint_d
          nodejs-slim
          pnpm
        ];
      };
    });
  };
}
