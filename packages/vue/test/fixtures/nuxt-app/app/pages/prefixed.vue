<template>
  <VBarChart
    :data="[{ name: 'Alpha', value: 10 }]"
    :width="400"
    :height="300"
  >
    <VBar
      data-key="value"
      :is-animation-active="false"
    />
  </VBarChart>
</template>
