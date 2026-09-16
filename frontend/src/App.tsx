import React, { useEffect, useState } from 'react';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DatasetsPage } from './pages/DatasetsPage';
import { ExperimentsPage } from './pages/ExperimentsPage';
import { ExplainabilityPage } from './pages/ExplainabilityPage';
import { ModelComparisonPage } from './pages/ModelComparisonPage';
import { OverviewPage } from './pages/OverviewPage';
import { PredictionPage } from './pages/PredictionPage';
import { RobustnessLabPage } from './pages/RobustnessLabPage';
import { SafetyDecisionPage } from './pages/SafetyDecisionPage';
import { SensorMonitorPage } from './pages/SensorMonitorPage';
import { SettingsPage } from './pages/SettingsPage';
import { TrainingPage } from './pages/TrainingPage';
import { VisionInspectionPage } from './pages/VisionInspectionPage';
import { getLiveStream } from './services/api';
import { LiveStreamData } from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [liveData, setLiveData] = useState<LiveStreamData | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // Poll live telemetry stream
  useEffect(() => {
    let stepCount = 0;

    const fetchLive = async () => {
      if (!isSimulating) return;
      try {
        const data = await getLiveStream();
        setLiveData(data);
      } catch (err) {
        // Fallback simulation generator if backend is momentarily unreachable
        stepCount++;
        const phase = stepCount * 0.15;
        const vib = Number((0.25 + Math.sin(phase) * 0.15 + (Math.random() - 0.5) * 0.05).toFixed(3));
        const curr = Number((2.8 + Math.cos(phase * 0.8) * 0.4).toFixed(2));
        const temp = Number((48 + Math.sin(phase * 0.3) * 6).toFixed(1));
        const risk = Number(Math.max(0.05, Math.min(0.95, (vib * 0.5) + (temp > 50 ? 0.3 : 0.1))).toFixed(2));

        setLiveData({
          step: stepCount,
          timestamp: Date.now(),
          vibration: vib,
          current: curr,
          temperature: temp,
          failure_risk: risk,
          robot_status: risk > 0.65 ? 'HIGH RISK' : risk > 0.35 ? 'WARNING' : 'OPERATIONAL',
          predicted_failure: risk > 0.65 ? 'Bearing Fatigue' : risk > 0.35 ? 'Mechanical Wear' : 'None (Normal)',
          recommended_action: risk > 0.65 ? 'SCHEDULE MAINTENANCE' : 'CONTINUE OPERATION',
          data_mode: 'DEMONSTRATION SIMULATION',
        });
      }
    };

    fetchLive();
    const interval = setInterval(fetchLive, 2000);
    return () => clearInterval(interval);
  }, [isSimulating]);

  const renderActivePage = () => {
    switch (currentTab) {
      case 'overview':
        return <OverviewPage liveData={liveData} onNavigateTab={setCurrentTab} />;
      case 'sensors':
        return <SensorMonitorPage liveData={liveData} />;
      case 'vision':
        return <VisionInspectionPage />;
      case 'prediction':
        return <PredictionPage />;
      case 'explainability':
        return <ExplainabilityPage />;
      case 'robustness':
        return <RobustnessLabPage />;
      case 'safety':
        return <SafetyDecisionPage />;
      case 'comparison':
        return <ModelComparisonPage />;
      case 'experiments':
        return <ExperimentsPage />;
      case 'datasets':
        return <DatasetsPage />;
      case 'training':
        return <TrainingPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage liveData={liveData} onNavigateTab={setCurrentTab} />;
    }
  };

  return (
    <DashboardLayout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      liveData={liveData}
      isSimulating={isSimulating}
      onToggleSimulation={() => setIsSimulating(!isSimulating)}
    >
      {renderActivePage()}
    </DashboardLayout>
  );
};

export default App;
