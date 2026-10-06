import type { Size } from '@/types'
/**
 * Normalizes the angle so that 0 <= angle < 180.
 * @param {number} angle Angle in degrees.
 * @return {number} the normalized angle with a value of at least 0 and never greater or equal to 180.
 */
export function normalizeAngle(angle: number) {
  return ((angle % 180) + 180) % 180
}

/**
 * Calculates the width of the largest horizontal line that fits inside a rectangle that is displayed at an angle.
 * @param {object} size Width and height of the text in a horizontal position.
 * @param {number} size.width Horizontal text width.
 * @param {number} size.height Horizontal text height.
 * @param {number} angle Angle in degrees in which the text is displayed.
 * @return {number} The width of the largest horizontal line that fits inside a rectangle that is displayed at an angle.
 */
export function getAngledRectangleWidth({ width, height }: Size, angle: number | undefined = 0) {
  // Ensure angle is >= 0 && < 180
  const normalizedAngle = normalizeAngle(angle)
  const angleRadians = (normalizedAngle * Math.PI) / 180

  /* Depending on the height and width of the rectangle, we may need to use different formulas to calculate the angled
   * width. This threshold defines when each formula should kick in. */
  const angleThreshold = Math.atan(height / width)

  const angledWidth
    = angleRadians > angleThreshold && angleRadians < Math.PI - angleThreshold
      ? height / Math.sin(angleRadians)
      : width / Math.cos(angleRadians)

  return Math.abs(angledWidth)
}
