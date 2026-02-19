import { ScreenControl } from "../commands/ScreenControl";
import { ColorPicker } from "../commands/ColorPicker";
import { ImageUpload } from "../commands/ImageUpload";
import { GifUpload } from "../commands/GifUpload";
import { CarouselUpload } from "../commands/CarouselUpload";
import { CanvasDrawing } from "../commands/CanvasDrawing";
import { ClockControl } from "../commands/ClockControl";
import { CountdownControl } from "../commands/CountdownControl";
import { ChronographControl } from "../commands/ChronographControl";
import { ScoreboardControl } from "../commands/ScoreboardControl";
import { PixelControl } from "../commands/PixelControl";
import { EffectControl } from "../commands/EffectControl";
import { SpeedControl } from "../commands/SpeedControl";
import { TextDisplay } from "../commands/TextDisplay";
import { PasswordControl } from "../commands/PasswordControl";
import { TimeIndicatorControl } from "../commands/TimeIndicatorControl";
import { ResetDevice } from "../commands/ResetDevice";

const panels: Record<string, () => React.ReactElement> = {
  screen: ScreenControl,
  color: ColorPicker,
  image: ImageUpload,
  gif: GifUpload,
  carousel: CarouselUpload,
  canvas: CanvasDrawing,
  clock: ClockControl,
  countdown: CountdownControl,
  chronograph: ChronographControl,
  scoreboard: ScoreboardControl,
  pixel: PixelControl,
  effect: EffectControl,
  speed: SpeedControl,
  text: TextDisplay,
  password: PasswordControl,
  "time-indicator": TimeIndicatorControl,
  reset: ResetDevice,
};

interface MainContentProps {
  activePanel: string;
}

export function MainContent({ activePanel }: MainContentProps) {
  const Panel = panels[activePanel];

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {Panel ? <Panel /> : <p className="text-gray-500">Select a panel</p>}
    </main>
  );
}
