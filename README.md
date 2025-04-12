# ComfyJazz Redux

Play easy-listening, computer-generated Jazz music in your browser or integrate it with your Twitch channel!

## About

ComfyJazz Redux is a modernized version of the original ComfyJazz project. It generates soothing jazz music that can play automatically or respond to input like keyboard presses or Twitch chat messages.

This project is based on [Instafluff's ComfyJazz](https://github.com/instafluff/ComfyJazz), which was inspired by [Google's Launch Night In](https://launchnightin.withgoogle.com/en/) music toy.

## Features

- Web-based jazz music generator with customizable parameters
- Multiple instrument options (piano, vibraphone, sax, guitar, and more)
- Control panel for adjusting settings (toggle with 'C' key)
- Twitch chat integration
- Keyboard input support
- Reset to defaults functionality

## Usage

### Online Demo

Visit the hosted version at <https://comfyjazz.zephsinx.com>

### Twitch Integration

Add this as a Browser Source in your streaming software and replace `yourchannel` with your Twitch username:

```url
https://comfyjazz.zephsinx.com/?channel=yourchannel
```

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Configuration Options

You can customize ComfyJazz using URL parameters:

- `?instrument=piano` - Set the initial instrument (options: piano, vibraphone, twinkle, sax, sax2, harp, guzheng, guitar, clarinet)
- `?volume=0.5` - Set the initial volume (0-1)
- `?channel=yourchannelname` - Enable Twitch chat integration

## Controls

- Press any key to play a note progression (when control panel is hidden)
- Press 'C' to toggle the control panel
- Use the control panel to adjust:
  - Instrument selection
  - Volume
  - Auto-play settings (toggle, frequency, and delay)
  - Pitch transposition
  - Reset to defaults

## Credits

### Original Creator

- [Instafluff](https://github.com/instafluff) - Creator of the original ComfyJazz

### Redux Version

- [zephsinx](https://github.com/zephsinx) - Modernization and enhancements

### Original Contributors

_Instafluff, Instafriend, MrRayKoma, That_MS_Gamer, NEvVvR, Shaezonai, BungalowGlow, aRandomTim, icecreamtango, jellyw00t, JessaTheBesta, marc2067, PomoTheDog, PortaalGaming, walpolea, Wasabi_Cheetah, JupiterZky, shineslove, X8Y8Z8X, BuilderArgus, Ellenary, neniltheelf, its_indy_, TgMrP1, huggable*hug, narendev, codesillystuff, Kurokirisu, Caffidget, Sparkie108, Munin\_\_, Krisc119, TheRukus, AmericanVikingJohn, MaartenVanStam, greybush1982, paranoidandroidiot, claireunaware, gohaku88, DutchGamer46, KappaMangos, JeanValjean80, LinusvDev, LilyHazel, DreamGardenPanda, bigdoggy101, TheBookSnail, thatgirllee92, simrose4u, Markee_68Q, WazabyDev, EssieLessie, livecoding, DevMerlin, Lasamat, corporatistic, Grallih, AnnaCodes, cheppy4444dude, shadowcraft5, sparky_pugwash, holloway87, Kilo_Predator, cryogen_sw, TripleMused, Bjwhite211, Jah2369, EverydayGamerM, AllanJLA, Maayainsane, kbgagt, rota22\*, Amarin*, TheArtOfKimmy, Rosuav, fikapaus, MizeKa, emzie94, snake1987, rmilesi009, GiRLaZo, kajrov, Simpathey, Beldathas, Cuicui_off, maxi_moff*, RadzikART, rurutu, VivYaong, lucsflipflop, jeckle, Netjamjr, kevinsjoberg, eateren, TaleLearnCode, Agentdave7, masaki_tty, Chumblez*, wabes1, SullyGnome, TheNutellaOreo, BrewAndTheCrew, Laks_1, iam_vikas, mycatlikestuna, HellGreen, tiana88dreamer, creador_de_mundos, Lawralee, chewitdude, FuriousFur, Ogaithus, microbesMA, Wietlol, Schkullie, reapersrealmsgaming, vikingcoder, julieee22, n1p2, A_Ninja_For_Jesus_Bruh, MurdocTurner, mikaiala\*

## License

MIT License - see the original [LICENSE](LICENSE) file for details.
