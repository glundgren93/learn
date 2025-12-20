import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm } from 'fs/promises';
import {
  initializeProgress,
  loadProgress,
  markStageComplete,
  incrementAttempts,
  getCurrentStage,
  setActiveTopic,
  getActiveTopic,
  getAllTopicsProgress,
} from './progress.js';

const TEST_LEARNING_DIR = './test-learning';

describe('Progress Service', () => {
  beforeEach(async () => {
    process.env.LEARNING_DIR = TEST_LEARNING_DIR;
    await mkdir(TEST_LEARNING_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_LEARNING_DIR, { recursive: true, force: true });
    delete process.env.LEARNING_DIR;
  });

  it('should initialize progress with first stage unlocked', async () => {
    const progress = await initializeProgress('test-topic', 5);

    expect(progress.topic).toBe('test-topic');
    expect(progress.currentStage).toBe(1);
    expect(progress.stages['1'].status).toBe('in_progress');
    expect(progress.stages['2'].status).toBe('locked');
    expect(progress.stages['5'].status).toBe('locked');
  });

  it('should load saved progress', async () => {
    await initializeProgress('test-topic', 3);
    const loaded = await loadProgress('test-topic');

    expect(loaded).not.toBeNull();
    expect(loaded?.topic).toBe('test-topic');
    expect(loaded?.currentStage).toBe(1);
  });

  it('should return null for non-existent progress', async () => {
    const loaded = await loadProgress('non-existent');
    expect(loaded).toBeNull();
  });

  it('should mark stage as complete and unlock next', async () => {
    await initializeProgress('test-topic', 3);
    await markStageComplete('test-topic', 1);

    const progress = await loadProgress('test-topic');
    expect(progress?.stages['1'].status).toBe('completed');
    expect(progress?.stages['2'].status).toBe('in_progress');
    expect(progress?.currentStage).toBe(2);
  });

  it('should increment attempts for in-progress stage', async () => {
    await initializeProgress('test-topic', 3);
    await incrementAttempts('test-topic', 1);
    await incrementAttempts('test-topic', 1);

    const progress = await loadProgress('test-topic');
    expect(progress?.stages['1'].attempts).toBe(2);
  });

  it('should get current stage', async () => {
    await initializeProgress('test-topic', 3);
    const stage = await getCurrentStage('test-topic');
    expect(stage).toBe(1);
  });

  it('should set and get active topic', async () => {
    await setActiveTopic('my-topic');
    const active = await getActiveTopic();
    expect(active).toBe('my-topic');
  });

  it('should return null when no active topic is set', async () => {
    const active = await getActiveTopic();
    expect(active).toBeNull();
  });

  it('should get all topics progress', async () => {
    await initializeProgress('topic-1', 3);
    await initializeProgress('topic-2', 5);

    const allProgress = await getAllTopicsProgress();
    expect(allProgress).toHaveLength(2);
    expect(allProgress.map((p) => p.topic)).toContain('topic-1');
    expect(allProgress.map((p) => p.topic)).toContain('topic-2');
  });

  it('should return empty array when no topics exist', async () => {
    const allProgress = await getAllTopicsProgress();
    expect(allProgress).toEqual([]);
  });
});
