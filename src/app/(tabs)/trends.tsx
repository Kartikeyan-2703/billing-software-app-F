import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { usePos, inr } from '../../lib/pos-store';
import { PasswordGate } from '../../components/PasswordGate';

const screenWidth = Dimensions.get('window').width;

export default function TrendsScreen() {
  const { trends } = usePos();

  const stats = useMemo(() => {
    if (!trends) return null;
    
    return {
      ...trends,
      paymentData: trends.paymentData.map((p: any, i: number) => {
        let sliceColor = PIE_COLORS[i % PIE_COLORS.length];
        if (p.name.toLowerCase() === 'cash') sliceColor = '#10b981'; // Green
        if (p.name.toLowerCase() === 'upi') sliceColor = '#06b6d4'; // Blue
        return {
          name: p.name,
          population: p.value,
          color: sliceColor,
          legendFontColor: '#71717a',
          legendFontSize: 12,
        };
      }),
      orderTypeData: trends.orderTypeData.map((o: any, i: number) => {
        let sliceColor = PIE_COLORS[i % PIE_COLORS.length];
        if (o.name.toLowerCase() === 'take away') sliceColor = '#10b981'; // Green
        if (o.name.toLowerCase() === 'dine-in') sliceColor = '#06b6d4'; // Blue
        return {
          name: o.name,
          population: o.value,
          color: sliceColor,
          legendFontColor: '#71717a',
          legendFontSize: 12,
        };
      }),
    };
  }, [trends]);

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(15, 160, 92, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(113, 113, 122, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 0,
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: '#e4e4e7',
      strokeDasharray: '0',
    },
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <PasswordGate title="Trends Locked" gateType="trends">
        <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Historical Trends</Text>
          <Text style={styles.headerSubtitle}>Sales & performance</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.grid}>
          <StatCard label="TODAY" value={inr(stats.today)} />
          <StatCard label="THIS WEEK" value={inr(stats.week)} />
          <StatCard label="THIS MONTH" value={inr(stats.month)} />
          <StatCard label="TOTAL ORDERS" value={stats.totalOrders.toString()} />
          <StatCard label="AVG. ORDER" value={inr(stats.avg)} />
          <StatCard label="TOP PAYMENT" value={stats.paymentTop ? stats.paymentTop[0] : '—'} />
        </View>

        <Panel title="REVENUE · LAST 7 DAYS">
          <SimpleBarChart data={stats.dailyData} labels={stats.dailyLabels} />
        </Panel>

        <View style={styles.grid2Col}>
          <Panel title="BEST SELLER" style={{ flex: 1, marginBottom: 0 }}>
            {stats.best ? (
              <View>
                <Text style={styles.bestName}>{stats.best.name}</Text>
                <Text style={styles.bestSub}>
                  {stats.best.qty} sold · {inr(stats.best.revenue)}
                </Text>
              </View>
            ) : (
              <Empty />
            )}
          </Panel>
          <Panel title="LEAST SOLD" style={{ flex: 1, marginBottom: 0 }}>
            {stats.worst ? (
              <View>
                <Text style={styles.bestName}>{stats.worst.name}</Text>
                <Text style={styles.bestSub}>{stats.worst.qty} sold</Text>
              </View>
            ) : (
              <Empty />
            )}
          </Panel>
        </View>

        <Panel title="TOP 5 SELLING ITEMS">
          {stats.top5.length ? (
            <View>
              {stats.top5.map((i, idx) => (
                <View key={i.name} style={[styles.listItem, idx > 0 && styles.listItemBorder]}>
                  <View style={styles.listItemLeft}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankBadgeText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.listItemName} numberOfLines={1}>{i.name}</Text>
                  </View>
                  <Text style={styles.listItemQty}>{i.qty}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Empty />
          )}
        </Panel>

        <View style={styles.grid2Col}>
          <Panel title="PAYMENT SPLIT" style={{ flex: 1, marginBottom: 0 }}>
            <MiniPie data={stats.paymentData} />
          </Panel>
          <Panel title="DINE-IN VS TAKE AWAY" style={{ flex: 1, marginBottom: 0 }}>
            <MiniPie data={stats.orderTypeData} />
          </Panel>
        </View>

        <Panel title="LOWEST SELLING ITEMS">
          {stats.bottom.length ? (
            <View>
              {stats.bottom.map((i, idx) => (
                <View key={i.name} style={[styles.listItem, idx > 0 && styles.listItemBorder]}>
                  <Text style={styles.listItemName} numberOfLines={1}>{i.name}</Text>
                  <Text style={styles.listItemQty}>{i.qty}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Empty />
          )}
        </Panel>
      </ScrollView>
      </View>
      </PasswordGate>
    </SafeAreaView>
  );
}

const PIE_COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ec4899'];

function MiniPie({ data }: { data: any[] }) {
  if (data.length === 0) return <Empty />;

  let chartData = data;
  if (data.length > 1) {
    const total = data.reduce((sum, d) => sum + d.population, 0);
    const gapValue = total * 0.0055; // Matches exactly the 2-degree paddingAngle of Recharts
    chartData = data.flatMap((d) => [
      d,
      {
        name: d.name + '_gap',
        population: gapValue,
        color: '#ffffff', 
      }
    ]);
  }

  return (
    <View style={styles.miniPieContainer}>
      <View style={{ position: 'relative', width: 100, height: 100, justifyContent: 'center', alignItems: 'center' }}>
        <PieChart
          data={chartData}
          width={100}
          height={100}
          chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="25"
          hasLegend={false}
          absolute
        />
        {/* Hack to convert solid pie chart into a donut chart */}
        <View style={{ position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff' }} />
      </View>
      <View style={styles.miniPieLegend}>
        {data.map((d, i) => (
          <View key={d.name} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: d.color }]} />
            <Text style={styles.legendName}>{d.name}</Text>
            <Text style={styles.legendValue}>· {d.population}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SimpleBarChart({ data, labels }: { data: number[], labels: string[] }) {
  const maxVal = Math.max(...data, 10);
  const max = Math.ceil(maxVal / 4) * 4;
  const steps = [4, 3, 2, 1, 0];
  const chartHeight = 160;

  return (
    <View style={styles.simpleBarContainer}>
      <View style={{ height: chartHeight, position: 'relative' }}>
        
        {/* Grid Lines */}
        {steps.map((step, i) => (
          <View key={step} style={{
            position: 'absolute',
            top: i * (chartHeight / 4),
            left: 0,
            right: 0,
            flexDirection: 'row',
            zIndex: 1
          }}>
            <Text style={{ width: 40, fontSize: 11, color: '#71717a', top: -7 }}>
              {Math.round((max * step) / 4)}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: step === 0 ? '#d4d4d8' : '#e4e4e7' }} />
          </View>
        ))}

        {/* Bars */}
        <View style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 40,
          right: 0,
          flexDirection: 'row',
          alignItems: 'flex-end',
          zIndex: 2
        }}>
          {data.map((val, i) => {
            const heightPct = (val / max) * 100;
            return (
              <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                <View style={[styles.simpleBarFill, { height: `${heightPct}%`, minHeight: val > 0 ? 4 : 0 }]} />
              </View>
            );
          })}
        </View>

      </View>

      {/* X-Axis Labels */}
      <View style={{ flexDirection: 'row', marginLeft: 40, marginTop: 16 }}>
        {labels.map((label, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: '#71717a' }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function Panel({ title, children, style }: { title: string; children: React.ReactNode; style?: any }) {
  return (
    <View style={[styles.panel, style]}>
      <Text style={styles.panelTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Empty() {
  return <Text style={styles.emptyText}>No data yet.</Text>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    backgroundColor: '#fafafa',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
    zIndex: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#09090b',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#71717a',
    marginTop: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    minWidth: '45%',
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#09090b',
    marginTop: 4,
  },
  panel: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  panelTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  chartContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  grid2Col: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  bestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09090b',
  },
  bestSub: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 4,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  listItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#e4e4e7',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#e1f7e7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0fa05c',
  },
  listItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#09090b',
    flex: 1,
  },
  listItemQty: {
    fontSize: 14,
    color: '#52525b',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  emptyText: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  miniPieContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  miniPieWrapper: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  miniPieLegend: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendName: {
    fontSize: 11,
    color: '#3f3f46',
  },
  legendValue: {
    fontSize: 11,
    color: '#a1a1aa',
  },
  simpleBarContainer: {
    paddingTop: 20,
    paddingBottom: 12,
    paddingRight: 16,
  },
  simpleBarFill: {
    width: '85%',
    backgroundColor: '#0fa05c',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  }
});
