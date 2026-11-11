import { Composition, registerRoot } from "remotion";
import { StoryVideo } from "./AnimationPreview";
import { CharacterMotion, type Motion } from "./CharacterMotionPreview";

function RemotionRoot() {
  return (
    <>
    <Composition
      id="IlkAnimasyon"
      component={StoryVideo}
      durationInFrames={450}
      calculateMetadata={({ props }) => ({
        durationInFrames: Math.max(
            1,
            props.scenes.reduce(
            (total, scene) =>
                total + Math.max(1, Math.round(scene.duration_seconds * 30)),
            0
            )
        ),
        })}
      fps={30}
      width={960}
      height={540}
      defaultProps={{
        scenes: [
          {
            id: 1,
            text: "Küçük robot ormanda yürür.",
            duration_seconds: 5,
          },
          {
            id: 2,
            text: "Bir tilkiyle karşılaşır.",
            duration_seconds: 5,
          },
          {
            id: 3,
            text: "Birlikte eve dönerler.",
            duration_seconds: 5,
          },
        ],
      }}
    />
    <Composition
      id="KarakterAnimasyonu"
      component={CharacterMotion}
      durationInFrames={150}
      fps={30}
      width={960}
      height={540}
      defaultProps={{
        imageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aK1sAAAAASUVORK5CYII=",
        motion: "slide" as Motion,
      }}
    />
    </>
  );
}

registerRoot(RemotionRoot);
