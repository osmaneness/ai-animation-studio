import { Composition, registerRoot } from "remotion";
import { StoryVideo } from "./AnimationPreview";

function RemotionRoot() {
  return (
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
  );
}

registerRoot(RemotionRoot);