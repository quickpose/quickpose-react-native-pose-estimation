export interface FeatureItem {
  label: string;
  feature: string;
}

export interface FeatureCategory {
  name: string;
  features: FeatureItem[];
}

export const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    name: 'Overlay',
    features: [
      {label: 'Whole Body', feature: 'overlay.wholeBody'},
      {label: 'Whole Body & Head', feature: 'overlay.wholeBodyAndHead'},
      {label: 'Upper Body', feature: 'overlay.upperBody'},
      {label: 'Straight Arms Upper Body', feature: 'overlay.straightArmsUpperBody'},
      {label: 'To Wrists Upper Body', feature: 'overlay.toWristsUpperBody'},
      {label: 'Lower Body', feature: 'overlay.lowerBody'},
      {label: 'Shoulders', feature: 'overlay.shoulders'},
      {label: 'Left Arm', feature: 'overlay.arm.left'},
      {label: 'Right Arm', feature: 'overlay.arm.right'},
      {label: 'Left Arm to Wrist', feature: 'overlay.armToWrist.left'},
      {label: 'Right Arm to Wrist', feature: 'overlay.armToWrist.right'},
      {label: 'Left Arm No Elbow', feature: 'overlay.armNoElbow.left'},
      {label: 'Right Arm No Elbow', feature: 'overlay.armNoElbow.right'},
      {label: 'Left Straight Arm', feature: 'overlay.straightArm.left'},
      {label: 'Right Straight Arm', feature: 'overlay.straightArm.right'},
      {label: 'Left Hand', feature: 'overlay.hand.left'},
      {label: 'Right Hand', feature: 'overlay.hand.right'},
      {label: 'Left Leg', feature: 'overlay.leg.left'},
      {label: 'Right Leg', feature: 'overlay.leg.right'},
      {label: 'Arms', feature: 'overlay.arms'},
      {label: 'Legs', feature: 'overlay.legs'},
      {label: 'Hips', feature: 'overlay.hips'},
      {label: 'Elbows', feature: 'overlay.elbows'},
      {label: 'Knees', feature: 'overlay.knees'},
      {label: 'Head', feature: 'overlay.head'},
      {label: 'Show Points', feature: 'showPoints'},
    ],
  },
  {
    name: 'Range of Motion',
    features: [
      {label: 'Left Shoulder', feature: 'rangeOfMotion.shoulder.left'},
      {label: 'Right Shoulder', feature: 'rangeOfMotion.shoulder.right'},
      {label: 'Left Elbow', feature: 'rangeOfMotion.elbow.left'},
      {label: 'Right Elbow', feature: 'rangeOfMotion.elbow.right'},
      {label: 'Left Hip', feature: 'rangeOfMotion.hip.left'},
      {label: 'Right Hip', feature: 'rangeOfMotion.hip.right'},
      {label: 'Left Knee', feature: 'rangeOfMotion.knee.left'},
      {label: 'Right Knee', feature: 'rangeOfMotion.knee.right'},
      {label: 'Left Ankle', feature: 'rangeOfMotion.ankle.left'},
      {label: 'Right Ankle', feature: 'rangeOfMotion.ankle.right'},
      {label: 'Neck', feature: 'rangeOfMotion.neck'},
      {label: 'Back', feature: 'rangeOfMotion.back'},
    ],
  },
  {
    name: 'Fitness',
    features: [
      {label: 'Squats', feature: 'fitness.squats'},
      {label: 'Push Ups', feature: 'fitness.pushUps'},
      {label: 'Jumping Jacks', feature: 'fitness.jumpingJacks'},
      {label: 'Sumo Squats', feature: 'fitness.sumoSquats'},
      {label: 'Lunges (Left)', feature: 'fitness.lunges.left'},
      {label: 'Lunges (Right)', feature: 'fitness.lunges.right'},
      {label: 'Sit Ups', feature: 'fitness.sitUps'},
      {label: 'Cobra Wings', feature: 'fitness.cobraWings'},
      {label: 'Plank', feature: 'fitness.plank'},
      {label: 'Plank (Straight Arm)', feature: 'fitness.plankStraightArm'},
      {label: 'Bicep Curls', feature: 'fitness.bicepCurls'},
      {label: 'Bicep Curls Left', feature: 'fitness.bicepCurlsSingleArm.left'},
      {label: 'Bicep Curls Right', feature: 'fitness.bicepCurlsSingleArm.right'},
      {label: 'Leg Raises', feature: 'fitness.legRaises'},
      {label: 'Glute Bridge', feature: 'fitness.gluteBridge'},
      {label: 'Overhead Dumbbell Press', feature: 'fitness.overheadDumbbellPress'},
      {label: 'V-Ups', feature: 'fitness.vUps'},
      {label: 'Lateral Raises', feature: 'fitness.lateralRaises'},
      {label: 'Front Raises', feature: 'fitness.frontRaises'},
      {label: 'Hip Abduction Standing (Left)', feature: 'fitness.hipAbductionStanding.left'},
      {label: 'Hip Abduction Standing (Right)', feature: 'fitness.hipAbductionStanding.right'},
      {label: 'Side Lunges (Left)', feature: 'fitness.sideLunges.left'},
      {label: 'Side Lunges (Right)', feature: 'fitness.sideLunges.right'},
      {label: 'Overarm Reach Bilateral', feature: 'fitness.overarmReachBilateral'},
      {label: 'Knee Raises Bilateral', feature: 'fitness.kneeRaisesBilateral'},
    ],
  },
  {
    name: 'Input',
    features: [
      {label: 'Raised Fingers', feature: 'raisedFingers'},
      {label: 'Raised Fingers (Left)', feature: 'raisedFingers.left'},
      {label: 'Raised Fingers (Right)', feature: 'raisedFingers.right'},
      {label: 'Thumbs Up', feature: 'thumbsUp'},
      {label: 'Thumbs Up (Left)', feature: 'thumbsUp.left'},
      {label: 'Thumbs Up (Right)', feature: 'thumbsUp.right'},
      {label: 'Thumbs Up/Down', feature: 'thumbsUpOrDown'},
      {label: 'Thumbs Up/Down (Left)', feature: 'thumbsUpOrDown.left'},
      {label: 'Thumbs Up/Down (Right)', feature: 'thumbsUpOrDown.right'},
    ],
  },
];
