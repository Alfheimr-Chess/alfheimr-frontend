with import <nixpkgs> {};

mkShell {
  buildInputs = [
    gnumake
    nodePackages.typescript
  ];
}
