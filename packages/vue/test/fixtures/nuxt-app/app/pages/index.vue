<script setup lang="ts">
const route = useRoute()
const animation = computed(() => route.query.animation !== 'off')
const data = [{ name: 'Alpha', value: 10 }, { name: 'Beta', value: 20 }]
</script>

<template>
  <main>
    <section
      v-for="responsive in [false, true]"
      :key="String(responsive)"
      :data-sizing="responsive ? 'responsive' : 'fixed'"
    >
      <BarChart
        :data="data"
        :width="responsive ? undefined : 400"
        :height="responsive ? undefined : 300"
      >
        <XAxis data-key="name" />
        <YAxis />
        <Bar
          data-key="value"
          :is-animation-active="animation"
        />
        <Tooltip />
      </BarChart>
      <AreaChart
        :data="data"
        :width="responsive ? undefined : 400"
        :height="responsive ? undefined : 300"
      >
        <XAxis data-key="name" />
        <YAxis />
        <Area
          data-key="value"
          :is-animation-active="animation"
        />
        <Tooltip />
      </AreaChart>
      <PieChart
        :width="responsive ? undefined : 400"
        :height="responsive ? undefined : 300"
      >
        <Pie
          :data="data"
          :is-animation-active="animation"
          data-key="value"
          name-key="name"
        />
        <Tooltip />
      </PieChart>
    </section>
  </main>
</template>
