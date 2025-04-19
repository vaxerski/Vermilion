## Building Vermilion

Building is only tested with `pnpm`. To build an AppImage, run:
```sh
pnpm i && pnpm build:linux
```

Due to some weird issues with the widevine electron fork, on Arch & co. you might need
to add `--no-sandbox --no-zygote` to the launch parameters for Vermilion to run:
```sh
./dist/vermilion-0.1.0.AppImage --no-zygote --no-sandbox
```
