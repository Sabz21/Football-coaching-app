// Football positions with translations
// Use these keys in your player forms

export const POSITIONS = {
  GK: 'goalkeeper',
  CB: 'center_back',
  LB: 'left_back',
  RB: 'right_back',
  CDM: 'defensive_midfielder',
  CM: 'central_midfielder',
  CAM: 'attacking_midfielder',
  LM: 'left_midfielder',
  RM: 'right_midfielder',
  LW: 'left_winger',
  RW: 'right_winger',
  ST: 'striker',
} as const;

export type PositionKey = keyof typeof POSITIONS;
export type PositionValue = typeof POSITIONS[PositionKey];

// For select dropdowns
export const POSITION_OPTIONS = Object.entries(POSITIONS).map(([key, value]) => ({
  value: key,
  labelKey: `positions.${value}`,
}));
