/* eslint-disable no-unused-vars -- the components are used in JSX */
import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

// Recharts has no default palette; these are the colors from its documentation.
export default function Chart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="desktop" name="Desktop" stroke="#8884d8" dot={false} />
        <Line type="monotone" dataKey="mobile" name="Mobile" stroke="#82ca9d" dot={false} />
        <Line type="monotone" dataKey="tablet" name="Tablet" stroke="#ffc658" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
