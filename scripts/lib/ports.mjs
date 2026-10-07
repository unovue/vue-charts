// Local ports for the check servers. Each check has its own default range; VCCS_PORTS=4620-4629
// moves every check into one range, so parallel runs and other local servers do not collide.
export function checkPorts(first, last) {
  const value = process.env.VCCS_PORTS
  const match = value?.match(/^(\d+)-(\d+)$/)
  if (value && (!match || Number(match[1]) > Number(match[2])))
    throw new Error(`VCCS_PORTS must look like 4620-4629, not ${value}`)
  const [from, to] = match ? [Number(match[1]), Number(match[2])] : [first, last]
  return Array.from({ length: to - from + 1 }, (_, index) => from + index)
}

/** A text such as "4620–4629" for error messages. */
export function portText(ports) {
  return `${ports[0]}–${ports.at(-1)}`
}
