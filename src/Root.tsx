import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {FPS, H, TL, W} from './lib';
import {AteVideo} from './ate/AteVideo';
import ATE from '../ate.timeline.json';

export const Root: React.FC = () => (
  <>
    <Composition
      id="EffortVideo"
      component={EffortVideo}
      durationInFrames={Math.round(TL.duration * FPS)}
      fps={FPS}
      width={W}
      height={H}
    />
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
    <Composition
      id="AteVideo"
      component={AteVideo}
      durationInFrames={Math.round(ATE.duration * ATE.fps)}
      fps={ATE.fps}
      width={1080}
      height={1350}
    />
  </>
);
