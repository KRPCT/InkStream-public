import { useAppStore } from '../../stores/appStore';
import TabItem from './TabItem';

export default function TabBar() {
  const { tabs } = useAppStore();

  if (tabs.length === 0) return null;

  return (
    <div className="ink-tabbar">
      {tabs.map((tab) => (
        <TabItem key={tab.id} tab={tab} />
      ))}
    </div>
  );
}
