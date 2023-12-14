import type { AppModel } from 'commonTypesWithClient/appModels';
import type { DisplayId } from 'commonTypesWithClient/branded';
import { useAtom } from 'jotai';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { userAtom } from 'src/atoms/user';
import { apiClient } from 'src/utils/apiClient';
import { returnNull } from 'src/utils/returnNull';
import { AppList } from './@components/AppList/AppList';
import { BasicHeader } from './@components/BasicHeader/BasicHeader';
import { ChatArea } from './@components/ChatArea/ChatArea';
import { InfoArea } from './@components/InfoArea/InfoArea';
import { WaitingContent } from './@components/WaitingContent/WaitingContent';
import styles from './index.module.css';

export type OptionalQuery = {
  id: DisplayId;
};

const Home = () => {
  const router = useRouter();
  const [user] = useAtom(userAtom);
  const [apps, setApps] = useState<AppModel[]>();
  const sortedApps = useMemo(
    () => apps?.sort((a, b) => b.createdTime - a.createdTime) ?? [],
    [apps]
  );
  const selectedAppId = useMemo(
    () => sortedApps.find((app) => app.displayId === router.query.id)?.id,
    [sortedApps, router.query.id]
  );
  const currentApp = useMemo<AppModel | undefined>(
    () => sortedApps.find((app) => app.id === selectedAppId),
    [selectedAppId, sortedApps]
  );
  const appendApp = (app: AppModel) => {
    setApps((apps) => [...(apps ?? []), app]);
    router.push(`/?id=${app.displayId}`);
  };
  const fetchApps = () =>
    apiClient.public.apps
      .$get()
      .then((res) => setApps((apps) => (JSON.stringify(apps) === JSON.stringify(res) ? apps : res)))
      .catch(returnNull);
  const updateContents = useCallback(async () => {
    if (currentApp === undefined) return;

    await apiClient.public.apps.bubbles.update
      .$patch({ body: { appId: currentApp.id } })
      .then((app) =>
        setApps((apps) => {
          // eslint-disable-next-line max-nested-callbacks
          const hasDiff = apps?.some((a) => JSON.stringify(a) === JSON.stringify(app));
          // eslint-disable-next-line max-nested-callbacks
          return hasDiff === true ? apps?.map((a) => (a.id === app.id ? app : a)) : apps;
        })
      )
      .catch(returnNull);
  }, [currentApp]);

  useEffect(() => {
    fetchApps();

    const intervalId = window.setInterval(fetchApps, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    updateContents();

    const intervalId = window.setInterval(updateContents, 5000);

    return () => clearInterval(intervalId);
  }, [updateContents]);

  useEffect(() => {
    if (apps !== undefined && apps.length > 0 && currentApp === undefined) {
      router.push(`/?id=${apps[0].displayId}`);
    }
  }, [apps, currentApp, router]);

  if (!user) return null;

  return (
    <>
      <BasicHeader user={user} />
      <div className={styles.main}>
        <div>
          <div className={styles.appList}>
            <AppList sortedApps={sortedApps} currentApp={currentApp} append={appendApp} />
          </div>
          {currentApp &&
            (currentApp.status === 'waiting' ? (
              <WaitingContent app={currentApp} />
            ) : (
              <>
                <div className={styles.chatArea}>
                  <ChatArea app={currentApp} />
                </div>
                <div className={styles.infoArea}>
                  <InfoArea app={currentApp} />
                </div>
              </>
            ))}
        </div>
      </div>
    </>
  );
};

export default Home;
