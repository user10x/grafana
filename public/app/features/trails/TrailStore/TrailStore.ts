import { debounce } from 'lodash';

import { SceneObject, SceneObjectRef, SceneObjectUrlValues, getUrlSyncManager, sceneUtils } from '@grafana/scenes';

import { DataTrail } from '../DataTrail';
import { TrailStepType } from '../DataTrailsHistory';
import { BOOKMARKED_TRAILS_KEY, RECENT_TRAILS_KEY } from '../shared';

const MAX_RECENT_TRAILS = 20;

export interface SerializedTrail {
  history: Array<{
    urlValues: SceneObjectUrlValues;
    type: TrailStepType;
    description: string;
  }>;
}

export class TrailStore {
  private _recent: Array<SceneObjectRef<DataTrail>> = [];
  private _bookmarks: Array<SceneObjectRef<DataTrail>> = [];
  private _save;

  constructor() {
    this.load();

    this._save = debounce(() => {
      const serializedRecent = this._recent
        .slice(0, MAX_RECENT_TRAILS)
        .map((trail) => this._serializeTrail(trail.resolve()));
      localStorage.setItem(RECENT_TRAILS_KEY, JSON.stringify(serializedRecent));

      const serializedBookmarks = this._bookmarks.map((trail) => this._serializeTrail(trail.resolve()));
      localStorage.setItem(BOOKMARKED_TRAILS_KEY, JSON.stringify(serializedBookmarks));
    }, 1000);
  }

  private _loadFromStorage(key: string) {
    const list: Array<SceneObjectRef<DataTrail>> = [];
    const storageItem = localStorage.getItem(key);

    if (storageItem) {
      const serializedTrails: SerializedTrail[] = JSON.parse(storageItem);
      for (const t of serializedTrails) {
        const trail = this._deserializeTrail(t);
        list.push(trail.getRef());
      }
    }
    return list;
  }

  private _deserializeTrail(t: SerializedTrail): DataTrail {
    // reconstruct the trail based on the the serialized history
    const trail = new DataTrail({});

    t.history.map((step) => {
      this._loadFromUrl(trail, step.urlValues);
      trail.state.history.addTrailStep(trail, step.type);
    });

    return trail;
  }

  private _serializeTrail(trail: DataTrail): SerializedTrail {
    const history = trail.state.history.state.steps.map((step) => {
      const stepTrail = new DataTrail(sceneUtils.cloneSceneObjectState(step.trailState));
      return {
        urlValues: getUrlSyncManager().getUrlState(stepTrail),
        type: step.type,
        description: step.description,
      };
    });
    return {
      history,
    };
  }

  private _loadFromUrl(node: SceneObject, urlValues: SceneObjectUrlValues) {
    node.urlSync?.updateFromUrl(urlValues);
    node.forEachChild((child) => this._loadFromUrl(child, urlValues));
  }

  // Recent Trails
  get recent() {
    return this._recent;
  }

  load() {
    this._recent = this._loadFromStorage(RECENT_TRAILS_KEY);
    this._bookmarks = this._loadFromStorage(BOOKMARKED_TRAILS_KEY);
  }

  setRecentTrail(trail: DataTrail) {
    this._recent = this._recent.filter((t) => t !== trail.getRef());
    this._recent.unshift(trail.getRef());
    this._save();
  }

  // Bookmarked Trails
  get bookmarks() {
    return this._bookmarks;
  }

  addBookmark(trail: DataTrail) {
    this._bookmarks.unshift(trail.getRef());
    this._save();
  }

  removeBookmark(index: number) {
    if (index < this._bookmarks.length) {
      this._bookmarks.splice(index, 1);
      this._save();
    }
  }
}

let store: TrailStore | undefined;
export function getTrailStore(): TrailStore {
  if (!store) {
    store = new TrailStore();
  }

  return store;
}
