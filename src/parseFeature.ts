import type {
  ParsedFeature,
  QuickPoseStyle,
  Side,
  LandmarksGroup,
  ROMJoint,
  FitnessExercise,
} from './types';

const LANDMARKS_GROUPS: ReadonlySet<string> = new Set<LandmarksGroup>([
  'wholeBody', 'wholeBodyAndHead', 'upperBody', 'straightArmsUpperBody',
  'toWristsUpperBody', 'shoulders', 'arm', 'armToWrist', 'armNoElbow',
  'straightArm', 'hand', 'leg', 'lowerBody', 'hips', 'elbows',
  'knees', 'legs', 'arms', 'head',
]);

const ROM_JOINTS: ReadonlySet<string> = new Set<ROMJoint>([
  'neck', 'shoulder', 'elbow', 'hip', 'back', 'knee', 'ankle',
]);

const FITNESS_EXERCISES: ReadonlySet<string> = new Set<FitnessExercise>([
  'squats', 'pushUps', 'jumpingJacks', 'sumoSquats', 'lunges',
  'sitUps', 'cobraWings', 'plank', 'plankStraightArm', 'legRaises',
  'gluteBridge', 'overheadDumbbellPress', 'vUps', 'lateralRaises',
  'frontRaises', 'hipAbductionStanding', 'sideLunges', 'bicepCurls',
  'bicepCurlsSingleArm', 'overarmReachBilateral', 'kneeRaisesBilateral',
]);

function parseSide(value: string | undefined): Side | undefined {
  if (value === 'left' || value === 'right') return value;
  return undefined;
}

function parseLandmarksGroup(parts: string[]): LandmarksGroup | null {
  const name = parts[0];
  if (!name || !LANDMARKS_GROUPS.has(name)) return null;
  return name as LandmarksGroup;
}

/**
 * Parses a feature string like "fitness.pushUps" or "inside.wholeBody" into a
 * structured ParsedFeature object. This is the single source of truth for
 * feature string interpretation — native code receives the structured result
 * and only needs to map identifiers to SDK enum values.
 */
export function parseFeatureString(
  featureString: string,
  style?: QuickPoseStyle,
): ParsedFeature | null {
  const parts = featureString.split('.');
  const category = parts[0];
  if (!category) return null;

  const base: Pick<ParsedFeature, 'featureKey' | 'style'> = {
    featureKey: featureString,
    style,
  };

  switch (category) {
    case 'overlay': {
      const group = parseLandmarksGroup(parts.slice(1));
      if (!group) return null;
      const side = parseSide(parts[2]);
      return { ...base, type: 'overlay', group, side };
    }

    case 'showPoints':
      return { ...base, type: 'showPoints' };

    case 'rangeOfMotion': {
      const jointName = parts[1];
      if (!jointName || !ROM_JOINTS.has(jointName)) return null;
      const joint = jointName as ROMJoint;
      const clockwise = parts[parts.length - 1] === 'clockwise';
      // Side is the part after the joint name, if it's not "clockwise"
      const sidePart = parts.length > 2 && parts[2] !== 'clockwise' ? parts[2] : undefined;
      const side = parseSide(sidePart);
      return { ...base, type: 'rangeOfMotion', joint, side, clockwise };
    }

    case 'fitness': {
      const exerciseName = parts[1];
      if (!exerciseName || !FITNESS_EXERCISES.has(exerciseName)) return null;
      const exercise = exerciseName as FitnessExercise;
      const side = parseSide(parts[2]);
      return { ...base, type: 'fitness', exercise, side };
    }

    case 'raisedFingers':
      return { ...base, type: 'raisedFingers', side: parseSide(parts[1]) };

    case 'thumbsUp':
      return { ...base, type: 'thumbsUp', side: parseSide(parts[1]) };

    case 'thumbsUpOrDown':
      return { ...base, type: 'thumbsUpOrDown', side: parseSide(parts[1]) };

    case 'inside': {
      const group = parts.length > 1
        ? (parseLandmarksGroup(parts.slice(1)) ?? 'wholeBodyAndHead')
        : 'wholeBodyAndHead';
      return { ...base, type: 'inside', group, edgeInsets: style?.edgeInsets };
    }

    case 'overlayHasCameraAsBackground': {
      const darken = parts.length > 1 ? parseFloat(parts[1]) || 0 : 0;
      return { ...base, type: 'overlayHasCameraAsBackground', darkenCamera: darken };
    }

    default:
      return null;
  }
}
