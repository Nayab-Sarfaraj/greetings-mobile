import { Composition, registerRoot } from "remotion";
import { FPS, VIDEO_SIZE } from "@greetings/shared";
import { GreetingComposition } from "./composition";
import { durationInFrames, templates } from "./templates";
export function RemotionRoot() {
  return (
    <>
      {templates.map((template) => (
        <Composition
          key={template.id}
          id={template.id}
          component={GreetingComposition}
          durationInFrames={durationInFrames(template)}
          fps={FPS}
          width={VIDEO_SIZE.width}
          height={VIDEO_SIZE.height}
          defaultProps={template.defaultProps}
          calculateMetadata={() => ({
            durationInFrames: durationInFrames(template),
          })}
        />
      ))}
    </>
  );
}
registerRoot(RemotionRoot);
