import React, { useMemo } from 'react';
import GoalHitRateChart from './widgets/GoalHitRateChart';
import StreakCounter from './widgets/StreakCounter';
import MilestoneHistoryTable from './widgets/MilestoneHistoryTable';
import ProfitVsGoalChart from './widgets/ProfitVsGoalChart';
import TimeToGoalEstimator from './widgets/TimeToGoalEstimator';
import AvgVsGoalKpis from './widgets/AvgVsGoalKpis';
import { withProrating } from '../../utils/goalAnalytics';

export default function GoalsTab({
  milestones,
  milestoneHistory = [],
  milestoneProgress,
  numberFormat,
  firstActivityDate,
}) {
  const processedHistory = useMemo(
    () => withProrating(milestoneHistory, firstActivityDate),
    [milestoneHistory, firstActivityDate]
  );

  return (
    <div className="analytics-stack">
      <StreakCounter milestoneHistory={processedHistory} />
      <AvgVsGoalKpis
        milestoneHistory={processedHistory}
        milestones={milestones}
        numberFormat={numberFormat}
      />
      <TimeToGoalEstimator
        milestones={milestones}
        milestoneProgress={milestoneProgress}
        numberFormat={numberFormat}
      />
      <GoalHitRateChart milestoneHistory={processedHistory} />
      <ProfitVsGoalChart
        milestoneHistory={processedHistory}
        numberFormat={numberFormat}
      />
      <MilestoneHistoryTable
        milestoneHistory={processedHistory}
        numberFormat={numberFormat}
      />
    </div>
  );
}
