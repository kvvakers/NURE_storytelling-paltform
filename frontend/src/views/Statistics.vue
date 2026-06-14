<template>
  <div class="stats-page _page">
    <div class="_container">
      <div class="stats-header _flex _ai-c _jc-sb _flex-wrap _gap-12">
        <div>
          <h1 class="_h2">Статистика: {{ storyTitle }}</h1>
          <p class="stats-subtitle">Аналітика для вашої історії</p>
        </div>
        <button class="btn btn-secondary _flex _ai-c _gap-6" @click="router.back()"><ArrowLeft :size="16" />Назад</button>
      </div>

      <div class="controls-row _flex _ai-c _jc-sb _flex-wrap _gap-12">
        <div class="period-tabs _flex _gap-8">
          <button
            v-for="p in periods"
            :key="p.value"
            class="btn"
            :class="period === p.value ? 'btn-primary' : 'btn-secondary'"
            @click="setPeriod(p.value)"
          >{{ p.label }}</button>
        </div>
        <div class="chart-type-tabs _flex _gap-8">
          <button
            v-for="t in chartTypes"
            :key="t.value"
            class="btn _flex _ai-c _gap-6"
            :class="chartType === t.value ? 'btn-primary' : 'btn-secondary'"
            @click="chartType = t.value"
          >{{ t.label }}</button>
        </div>
      </div>

      <div v-if="isLoading" class="loading-state">Завантаження статистики...</div>
      <div v-else-if="error" class="error-state">{{ error }}</div>
      <template v-else-if="stats">

        <div class="charts-grid">
          <!-- Reading time per chapter -->
          <div class="chart-card panel">
            <h2 class="chart-title">Час читання по главах</h2>
            <p class="chart-desc">Середній час читання кожної глави (в секундах)</p>
            <div v-if="noReadingData" class="no-data">Немає даних про час читання за вибраний період</div>
            <apexchart
              v-else
              :type="chartType"
              height="280"
              :options="readingTimeOptions"
              :series="readingTimeSeries"
            />
          </div>

          <!-- Likes timeline -->
          <div class="chart-card panel">
            <h2 class="chart-title">Вподобання за період</h2>
            <p class="chart-desc">Всього за період: <b>{{ totalLikes }}</b></p>
            <div v-if="totalLikes === 0" class="no-data">Немає вподобань за вибраний період</div>
            <apexchart
              v-else
              :type="chartType"
              height="280"
              :options="likesOptions"
              :series="likesSeries"
            />
          </div>

          <!-- Ratings timeline -->
          <div class="chart-card panel">
            <h2 class="chart-title">Нові оцінки за період</h2>
            <p class="chart-desc">Всього за період: <b>{{ totalRatings }}</b></p>
            <div v-if="totalRatings === 0" class="no-data">Немає оцінок за вибраний період</div>
            <apexchart
              v-else
              :type="chartType"
              height="280"
              :options="ratingsOptions"
              :series="ratingsSeries"
            />
          </div>

          <!-- Comments -->
          <div class="chart-card panel">
            <h2 class="chart-title">Коментарі</h2>
            <p class="chart-desc">
              До глав: <b>{{ totalChapterComments }}</b> &nbsp;·&nbsp;
              Загальні до історії: <b>{{ stats.storyCommentCount }}</b>
            </p>
            <div v-if="totalChapterComments === 0 && stats.storyCommentCount === 0" class="no-data">
              Немає коментарів за вибраний період
            </div>
            <apexchart
              v-else
              :type="chartType"
              height="280"
              :options="commentsOptions"
              :series="commentsSeries"
            />
          </div>

          <!-- Sessions by day of week -->
          <div class="chart-card panel">
            <h2 class="chart-title">Популярність по днях тижня</h2>
            <p class="chart-desc">Кількість сесій читання за кожен день тижня</p>
            <div v-if="noDayOfWeekData" class="no-data">Немає даних за вибраний період</div>
            <apexchart
              v-else
              type="polarArea"
              height="300"
              :options="dayOfWeekOptions"
              :series="dayOfWeekSeries"
            />
          </div>

          <!-- Sessions by hour -->
          <div class="chart-card panel">
            <h2 class="chart-title">Активність по годинах</h2>
            <p class="chart-desc">Розподіл сесій читання протягом доби</p>
            <apexchart
              :type="chartType"
              height="280"
              :options="sessionsByHourOptions"
              :series="sessionsByHourSeries"
            />
          </div>

          <!-- Chapter retention -->
          <div class="chart-card panel">
            <h2 class="chart-title">Утримання читачів</h2>
            <p class="chart-desc">Відсоток читачів, що дійшли до кожної глави</p>
            <div v-if="noRetentionData" class="no-data">Недостатньо даних для розрахунку утримання</div>
            <apexchart
              v-else
              type="bar"
              height="280"
              :options="retentionOptions"
              :series="retentionSeries"
            />
          </div>

          <!-- Unique readers timeline -->
          <div class="chart-card panel">
            <h2 class="chart-title">Унікальні читачі по днях</h2>
            <p class="chart-desc">Всього за період: <b>{{ totalUniqueReaders }}</b></p>
            <div v-if="totalUniqueReaders === 0" class="no-data">Немає даних про унікальних читачів за вибраний період</div>
            <apexchart
              v-else
              :type="chartType"
              height="280"
              :options="uniqueReadersOptions"
              :series="uniqueReadersSeries"
            />
          </div>

          <!-- Reading speed -->
          <div class="chart-card panel">
            <h2 class="chart-title">Швидкість читання по главах</h2>
            <p class="chart-desc">Середня кількість символів за хвилину для кожної глави</p>
            <div v-if="noReadingSpeedData" class="no-data">Недостатньо даних для розрахунку швидкості читання</div>
            <apexchart
              v-else
              :type="chartType"
              height="280"
              :options="readingSpeedOptions"
              :series="readingSpeedSeries"
            />
          </div>
        </div>

      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../utils/api';
import { ArrowLeft } from 'lucide-vue-next';

interface ChapterReadingTime { chapterIndex: number; totalSeconds: number }
interface TimelinePoint { date: string; count: number }
interface ChapterComment { chapterIndex: number; count: number }
interface DayOfWeekPoint { day: string; count: number }
interface HourPoint { hour: number; count: number }
interface RetentionPoint { chapterIndex: number; readers: number; percent: number }
interface ReadingSpeedPoint { chapterIndex: number; charsPerMinute: number }
interface StatsResponse {
  period: string;
  storyId: number;
  readingTimePerChapter: ChapterReadingTime[];
  likesTimeline: TimelinePoint[];
  ratingsTimeline: TimelinePoint[];
  commentsPerChapter: ChapterComment[];
  storyCommentCount: number;
  sessionsByDayOfWeek: DayOfWeekPoint[];
  sessionsByHour: HourPoint[];
  chapterRetention: RetentionPoint[];
  uniqueReadersTimeline: TimelinePoint[];
  readingSpeed: ReadingSpeedPoint[];
}

const route = useRoute();
const router = useRouter();
const storyId = computed(() => Number(route.params.id));
const storyTitle = ref('');
const stats = ref<StatsResponse | null>(null);
const isLoading = ref(false);
const error = ref('');
const period = ref<'day' | 'week' | 'month'>('week');

const periods = [
  { value: 'day' as const, label: 'День' },
  { value: 'week' as const, label: 'Тиждень' },
  { value: 'month' as const, label: 'Місяць' },
];

const chartType = ref<'bar' | 'line'>('bar');
const chartTypes = [
  { value: 'bar' as const, label: '▐ Стовпці' },
  { value: 'line' as const, label: '╱ Лінія' },
];

const formatDate = (iso: string) => {
  const [, month, day] = iso.split('-');
  return `${day}.${month}`;
};

const totalLikes = computed(() =>
  (stats.value?.likesTimeline ?? []).reduce((s, d) => s + d.count, 0),
);
const totalRatings = computed(() =>
  (stats.value?.ratingsTimeline ?? []).reduce((s, d) => s + d.count, 0),
);
const totalChapterComments = computed(() =>
  (stats.value?.commentsPerChapter ?? []).reduce((s, d) => s + d.count, 0),
);

const maxChapterIndex = computed(() => {
  const r = stats.value?.readingTimePerChapter ?? [];
  const c = stats.value?.commentsPerChapter ?? [];
  return Math.max(...r.map((x) => x.chapterIndex), ...c.map((x) => x.chapterIndex), -1);
});
const chapterLabels = computed(() =>
  Array.from({ length: maxChapterIndex.value + 1 }, (_, i) => `Глава ${i + 1}`),
);

const noReadingData = computed(() =>
  (stats.value?.readingTimePerChapter ?? []).every((r) => r.totalSeconds === 0) &&
  (stats.value?.readingTimePerChapter ?? []).length === 0,
);

// ── Reading time ──────────────────────────────────────────────
const readingTimeSeries = computed(() => {
  const map = new Map((stats.value?.readingTimePerChapter ?? []).map((r) => [r.chapterIndex, r.totalSeconds]));
  return [{ name: 'Секунди', data: chapterLabels.value.map((_, i) => map.get(i) ?? 0) }];
});
const readingTimeOptions = computed(() => ({
  chart: { toolbar: { show: false }, fontFamily: 'Arial, sans-serif' },
  colors: ['#007bff'],
  plotOptions: { bar: { borderRadius: 6, columnWidth: '55%' } },
  stroke: { curve: 'smooth', width: chartType.value === 'bar' ? 0 : 2 },
  fill: { type: 'solid' },
  dataLabels: { enabled: false },
  xaxis: { categories: chapterLabels.value },
  yaxis: { title: { text: 'секунд' }, min: 0, forceNiceScale: true },
  tooltip: { y: { formatter: (v: number) => `${Math.round(v)} с` } },
  grid: { borderColor: '#eee' },
}));

// ── Likes ─────────────────────────────────────────────────────
const likesSeries = computed(() => [{
  name: 'Вподобання',
  data: (stats.value?.likesTimeline ?? []).map((d) => d.count),
}]);
const likesOptions = computed(() => ({
  chart: { toolbar: { show: false }, fontFamily: 'Arial, sans-serif' },
  colors: ['#dc3545'],
  plotOptions: { bar: { borderRadius: 6, columnWidth: '55%' } },
  stroke: { curve: 'smooth', width: chartType.value === 'bar' ? 0 : 2 },
  fill: { type: 'solid' },
  dataLabels: { enabled: false },
  xaxis: { categories: (stats.value?.likesTimeline ?? []).map((d) => formatDate(d.date)) },
  yaxis: { min: 0, forceNiceScale: true, labels: { formatter: (v: number) => String(Math.round(v)) } },
  tooltip: { y: { formatter: (v: number) => `${v}` } },
  grid: { borderColor: '#eee' },
}));

// ── Ratings ───────────────────────────────────────────────────
const ratingsSeries = computed(() => [{
  name: 'Оцінки',
  data: (stats.value?.ratingsTimeline ?? []).map((d) => d.count),
}]);
const ratingsOptions = computed(() => ({
  chart: { toolbar: { show: false }, fontFamily: 'Arial, sans-serif' },
  colors: ['#fd7e14'],
  plotOptions: { bar: { borderRadius: 6, columnWidth: '55%' } },
  stroke: { curve: 'smooth', width: chartType.value === 'bar' ? 0 : 2 },
  fill: { type: 'solid' },
  dataLabels: { enabled: false },
  xaxis: { categories: (stats.value?.ratingsTimeline ?? []).map((d) => formatDate(d.date)) },
  yaxis: { min: 0, forceNiceScale: true, labels: { formatter: (v: number) => String(Math.round(v)) } },
  tooltip: { y: { formatter: (v: number) => `${v}` } },
  grid: { borderColor: '#eee' },
}));

// ── Comments ──────────────────────────────────────────────────
const commentsSeries = computed(() => {
  const map = new Map((stats.value?.commentsPerChapter ?? []).map((c) => [c.chapterIndex, c.count]));
  const data = [...chapterLabels.value.map((_, i) => map.get(i) ?? 0), stats.value?.storyCommentCount ?? 0];
  return [{ name: 'Коментарі', data }];
});
const commentsOptions = computed(() => {
  const labels = [...chapterLabels.value, 'Загальні'];
  return {
    chart: { toolbar: { show: false }, fontFamily: 'Arial, sans-serif' },
    colors: ['#28a745'],
    plotOptions: { bar: { borderRadius: 6, columnWidth: '55%' } },
    stroke: { curve: 'smooth', width: chartType.value === 'bar' ? 0 : 2 },
    fill: { type: 'solid' },
    dataLabels: { enabled: false },
    xaxis: { categories: labels },
    yaxis: { min: 0, forceNiceScale: true, labels: { formatter: (v: number) => String(Math.round(v)) } },
    tooltip: { y: { formatter: (v: number) => `${v}` } },
    grid: { borderColor: '#eee' },
  };
});

// ── Sessions by day of week ───────────────────────────────────
const noDayOfWeekData = computed(() =>
  (stats.value?.sessionsByDayOfWeek ?? []).every((d) => d.count === 0),
);
const dayOfWeekSeries = computed(() =>
  (stats.value?.sessionsByDayOfWeek ?? []).map((d) => d.count),
);
const dayOfWeekOptions = computed(() => ({
  chart: { toolbar: { show: false }, fontFamily: 'Arial, sans-serif' },
  colors: ['#6f42c1', '#17a2b8', '#e83e8c', '#20c997', '#fd7e14', '#007bff', '#dc3545'],
  labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
  legend: { position: 'bottom' },
  dataLabels: { enabled: false },
}));

// ── Sessions by hour ──────────────────────────────────────────
const sessionsByHourSeries = computed(() => [{
  name: 'Сесій',
  data: (stats.value?.sessionsByHour ?? []).map((h) => h.count),
}]);
const sessionsByHourOptions = computed(() => ({
  chart: { toolbar: { show: false }, fontFamily: 'Arial, sans-serif' },
  colors: ['#17a2b8'],
  plotOptions: { bar: { borderRadius: 4, columnWidth: '70%' } },
  stroke: { curve: 'smooth', width: chartType.value === 'bar' ? 0 : 2 },
  fill: { type: 'solid' },
  dataLabels: { enabled: false },
  xaxis: { categories: Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0')) },
  yaxis: { title: { text: 'сесій' }, min: 0, forceNiceScale: true, labels: { formatter: (v: number) => String(Math.round(v)) } },
  tooltip: { y: { formatter: (v: number) => `${v}` } },
  grid: { borderColor: '#eee' },
}));

// ── Chapter retention ─────────────────────────────────────────
const noRetentionData = computed(() => {
  const ret = stats.value?.chapterRetention ?? [];
  if (ret.length === 0) return true;
  const ch0 = ret.find((r) => r.chapterIndex === 0);
  return !ch0 || ch0.readers === 0;
});
const retentionMaxChapter = computed(() => {
  const ret = stats.value?.chapterRetention ?? [];
  if (ret.length === 0) return -1;
  return Math.max(...ret.map((r) => r.chapterIndex));
});
const retentionLabels = computed(() =>
  Array.from({ length: retentionMaxChapter.value + 1 }, (_, i) => `Глава ${i + 1}`),
);
const retentionSeries = computed(() => {
  const map = new Map((stats.value?.chapterRetention ?? []).map((r) => [r.chapterIndex, r.percent]));
  return [{ name: 'Читачів', data: retentionLabels.value.map((_, i) => map.get(i) ?? 0) }];
});
const retentionOptions = computed(() => ({
  chart: { toolbar: { show: false }, fontFamily: 'Arial, sans-serif' },
  colors: ['#e83e8c'],
  plotOptions: { bar: { borderRadius: 6, columnWidth: '55%' } },
  dataLabels: { enabled: false },
  stroke: { width: 0 },
  fill: { type: 'solid' },
  xaxis: { categories: retentionLabels.value },
  yaxis: { min: 0, max: 100, title: { text: '%' }, labels: { formatter: (v: number) => `${Math.round(v)}%` } },
  tooltip: { y: { formatter: (v: number) => `${Math.round(v)}%` } },
  grid: { borderColor: '#eee' },
}));

// ── Unique readers timeline ───────────────────────────────────
const totalUniqueReaders = computed(() =>
  (stats.value?.uniqueReadersTimeline ?? []).reduce((s, d) => s + d.count, 0),
);
const uniqueReadersSeries = computed(() => [{
  name: 'Унікальні читачі',
  data: (stats.value?.uniqueReadersTimeline ?? []).map((d) => d.count),
}]);
const uniqueReadersOptions = computed(() => ({
  chart: { toolbar: { show: false }, fontFamily: 'Arial, sans-serif' },
  colors: ['#20c997'],
  plotOptions: { bar: { borderRadius: 6, columnWidth: '55%' } },
  stroke: { curve: 'smooth', width: chartType.value === 'bar' ? 0 : 2 },
  fill: { type: 'solid' },
  dataLabels: { enabled: false },
  xaxis: { categories: (stats.value?.uniqueReadersTimeline ?? []).map((d) => formatDate(d.date)) },
  yaxis: { min: 0, forceNiceScale: true, labels: { formatter: (v: number) => String(Math.round(v)) } },
  tooltip: { y: { formatter: (v: number) => `${v}` } },
  grid: { borderColor: '#eee' },
}));

// ── Reading speed ─────────────────────────────────────────────
const noReadingSpeedData = computed(() =>
  (stats.value?.readingSpeed ?? []).length === 0,
);
const readingSpeedMaxChapter = computed(() => {
  const rs = stats.value?.readingSpeed ?? [];
  if (rs.length === 0) return -1;
  return Math.max(...rs.map((r) => r.chapterIndex));
});
const readingSpeedLabels = computed(() =>
  Array.from({ length: readingSpeedMaxChapter.value + 1 }, (_, i) => `Глава ${i + 1}`),
);
const readingSpeedSeries = computed(() => {
  const map = new Map((stats.value?.readingSpeed ?? []).map((r) => [r.chapterIndex, r.charsPerMinute]));
  return [{ name: 'симв/хв', data: readingSpeedLabels.value.map((_, i) => map.get(i) ?? 0) }];
});
const readingSpeedOptions = computed(() => ({
  chart: { toolbar: { show: false }, fontFamily: 'Arial, sans-serif' },
  colors: ['#fd7e14'],
  plotOptions: { bar: { borderRadius: 6, columnWidth: '55%' } },
  stroke: { curve: 'smooth', width: chartType.value === 'bar' ? 0 : 2 },
  fill: { type: 'solid' },
  dataLabels: { enabled: false },
  xaxis: { categories: readingSpeedLabels.value },
  yaxis: { title: { text: 'симв/хв' }, min: 0, forceNiceScale: true, labels: { formatter: (v: number) => String(Math.round(v)) } },
  tooltip: { y: { formatter: (v: number) => `${Math.round(v)} симв/хв` } },
  grid: { borderColor: '#eee' },
}));

const loadStats = async () => {
  isLoading.value = true;
  error.value = '';
  try {
    stats.value = await api.get(`/statistics/stories/${storyId.value}?period=${period.value}`);
  } catch (e: any) {
    error.value = e?.message || 'Помилка завантаження статистики';
  } finally {
    isLoading.value = false;
  }
};

const loadStoryTitle = async () => {
  try {
    const data = await api.get(`/stories/${storyId.value}`);
    storyTitle.value = data.title || '';
  } catch {}
};

const setPeriod = (p: 'day' | 'week' | 'month') => { period.value = p; };

onMounted(() => { loadStoryTitle(); loadStats(); });
watch(period, loadStats);
</script>

<style scoped>
.stats-page {
  background: var(--color-bg);
}

.stats-subtitle {
  color: var(--color-text-muted);
  margin: 4px 0 0;
}

.controls-row {
  margin: 24px 0;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

@media (max-width: 900px) {
  .charts-grid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .controls-row { flex-direction: column; align-items: flex-start; }
  .chart-card { padding: 16px; }
  .stats-header { flex-direction: column; align-items: flex-start; }
}

.chart-card {
  padding: 24px;
}

.chart-title {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0 0 4px;
}

.chart-desc {
  font-size: 0.88rem;
  color: var(--color-text-muted);
  margin: 0 0 12px;
}

.no-data {
  padding: 60px 0;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.loading-state,
.error-state {
  padding: 60px 0;
  text-align: center;
  font-size: 1rem;
  color: var(--color-text-muted);
}

.error-state { color: var(--color-danger); }
</style>
