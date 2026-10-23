import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DevServer } from '../src/core/DevServer.ts';
import type { Runtime } from '../src/core/runtime/Runtime.ts';
import type { Project } from '../src/project/Project.ts';
import type { BuildManager } from '../src/core/BuildManager.ts';

describe('dev server rebuild debounce', () => {
    let devServer: DevServer;
    let build: ReturnType<typeof vi.fn>;
    let reload: ReturnType<typeof vi.fn>;
    let error: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.useFakeTimers();
        build = vi.fn().mockResolvedValue(undefined);
        reload = vi.fn();
        error = vi.fn();
        devServer = new DevServer(
            { shouldLogVerbose: false, logger: { error } } as unknown as Runtime,
            { getSourcePath: () => '/src', getData: () => undefined } as unknown as Project,
            { build } as unknown as BuildManager,
        );
        devServer.server.reload = reload;
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('waits for a quiet period and reloads styles once for a rapid burst', async () => {
        devServer.queueRebuild('/src/main.scss');
        await vi.advanceTimersByTimeAsync(200);
        devServer.queueRebuild('/src/other.css');
        await vi.advanceTimersByTimeAsync(299);
        expect(build).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);
        expect(build).toHaveBeenCalledTimes(1);
        expect(reload).toHaveBeenCalledExactlyOnceWith('*.css');
    });

    it('uses a full reload when a burst includes a non-style file', async () => {
        devServer.queueRebuild('/src/main.scss');
        devServer.queueRebuild('/src/index.html');
        devServer.queueRebuild('/src/other.css');
        await vi.advanceTimersByTimeAsync(300);
        expect(build).toHaveBeenCalledTimes(1);
        expect(reload).toHaveBeenCalledExactlyOnceWith();
    });

    it.each([100, 500])('batches changes during a build lasting another %i ms', async (duration) => {
        let finishBuild!: () => void;
        build.mockImplementationOnce(() => new Promise<void>(resolve => { finishBuild = resolve; }));
        devServer.queueRebuild('/src/main.scss');
        await vi.advanceTimersByTimeAsync(300);
        devServer.queueRebuild('/src/index.html');
        devServer.queueRebuild('/src/other.css');
        await vi.advanceTimersByTimeAsync(duration);
        expect(build).toHaveBeenCalledTimes(1);
        finishBuild();
        await vi.advanceTimersByTimeAsync(0);
        if (duration < 300) {
            expect(build).toHaveBeenCalledTimes(1);
            await vi.advanceTimersByTimeAsync(300 - duration);
        }
        expect(build).toHaveBeenCalledTimes(2);
        expect(reload.mock.calls).toEqual([['*.css'], []]);
    });

    it('can rebuild after a failed build', async () => {
        build.mockRejectedValueOnce(new Error('build failed'));
        devServer.queueRebuild('/src/index.html');
        await vi.advanceTimersByTimeAsync(300);
        expect(error).toHaveBeenCalledWith('Dev rebuild failed: build failed');
        devServer.queueRebuild('/src/main.scss');
        await vi.advanceTimersByTimeAsync(300);
        expect(build).toHaveBeenCalledTimes(2);
        expect(reload).toHaveBeenCalledExactlyOnceWith('*.css');
    });
});
