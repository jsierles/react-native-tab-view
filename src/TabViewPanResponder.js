/* @flow */

import type { GestureEvent, GestureState } from './PanResponderTypes';
import type { Route, SceneRendererProps } from './TabViewTypeDefinitions';

type Props = SceneRendererProps & {
  route: Route
}

const POSITION_THRESHOLD = 120;
const VELOCITY_THRESHOLD = 0.000001;

function forSwipe(props: Props) {
  let currentValue = null, lastValue = null;

  props.position.addListener(({ value }) => (currentValue = value));

  function isIndexInRange(index: number) {
    const { routes } = props.navigationState;
    return (index >= 0 && index <= routes.length - 1);
  }

  function getNextIndex(evt: GestureEvent, gestureState: GestureState) {
    const { index } = props.navigationState;
    if (Math.abs(gestureState.dx) > POSITION_THRESHOLD || Math.abs(gestureState.vx) > VELOCITY_THRESHOLD) {
      const nextIndex = index - (gestureState.dx / Math.abs(gestureState.dx));
      if (isIndexInRange(nextIndex)) {
        return nextIndex;
      }
    }
    return index;
  }

  function canMoveScreen(evt: GestureEvent, gestureState: GestureState) {
    const { routes, index } = props.navigationState;
    return (
      (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) &&
      (Math.abs(gestureState.vx) > Math.abs(gestureState.vy)) &&
      (gestureState.dx > 0 && index !== 0) ||
      (gestureState.dx < 0 && index !== routes.length - 1)
    );
  }

  function startGesture() {
    lastValue = currentValue;
    props.position.stopAnimation();
  }

  function respondToGesture(evt: GestureEvent, gestureState: GestureState) {
    const { layout: { width } } = props;
    const currentPosition = typeof lastValue === 'number' ? lastValue : props.navigationState.index;
    const nextPosition = currentPosition - (gestureState.dx / width);
    if (isIndexInRange(nextPosition)) {
      props.position.setValue(nextPosition);
    }
  }

  function finishGesture(evt: GestureEvent, gestureState: GestureState) {
    const nextIndex = getNextIndex(evt, gestureState);
    props.jumpToIndex(nextIndex);
    lastValue = null;
  }

  return {
    onMoveShouldSetPanResponder: (evt: GestureEvent, gestureState: GestureState) => {
      return canMoveScreen(evt, gestureState);
    },
    onMoveShouldSetPanResponderCapture: (evt: GestureEvent, gestureState: GestureState) => {
      return canMoveScreen(evt, gestureState);
    },
    onPanResponderGrant: (evt: GestureEvent, gestureState: GestureState) => {
      startGesture(evt, gestureState);
    },
    onPanResponderMove: (evt: GestureEvent, gestureState: GestureState) => {
      respondToGesture(evt, gestureState);
    },
    onPanResponderTerminationRequest: () => true,
    onPanResponderRelease: (evt: GestureEvent, gestureState: GestureState) => {
      finishGesture(evt, gestureState);
    },
    onPanResponderTerminate: (evt: GestureEvent, gestureState: GestureState) => {
      finishGesture(evt, gestureState);
    },
  };
}

export default {
  forSwipe,
};
