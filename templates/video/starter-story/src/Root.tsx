import React from "react";
import { Composition } from "remotion";
import { Story, FPS, DURATION } from "./Story";

export const Root: React.FC = () => (
  <Composition id="Story" component={Story} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
);
