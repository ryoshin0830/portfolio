import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SchedulingConfig } from "@/types/scheduling";

const { generateTextMock, createSchedulingModelMock, modelMock } = vi.hoisted(() => {
  const modelMock = { modelId: "test-model" };
  return {
    generateTextMock: vi.fn(),
    createSchedulingModelMock: vi.fn(() => modelMock),
    modelMock,
  };
});

vi.mock("@/lib/scheduling-model", () => ({
  createSchedulingModel: createSchedulingModelMock,
}));

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return {
    ...actual,
    generateText: generateTextMock,
  };
});

vi.mock("@/lib/google-calendar", () => ({
  fetchBusy: vi.fn(),
  fetchCalendarEventContexts: vi.fn(),
  insertEvent: vi.fn(),
}));

import { fetchBusy, fetchCalendarEventContexts } from "@/lib/google-calendar";
import { findSlotsInRange } from "./scheduling";

const mockFetchBusy = vi.mocked(fetchBusy);
const mockFetchEventContexts = vi.mocked(fetchCalendarEventContexts);

function cfg(overrides: Partial<SchedulingConfig> = {}): SchedulingConfig {
  return {
    timezone: "Asia/Tokyo",
    utcOffset: "+09:00",
    startHour: 10,
    endHour: 15,
    slotMinutes: 60,
    leadMinutes: 120,
    travelPaddingBeforeMinutes: 60,
    travelPaddingAfterMinutes: 60,
    excludeWeekends: false,
    horizonDays: 30,
    ...overrides,
  };
}

describe("travel padding OpenRouter fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("OPENROUTER_API_KEY", "test-openrouter-key");
    mockFetchBusy.mockResolvedValue([
      {
        start: "2026-06-22T11:00:00+09:00",
        end: "2026-06-22T11:30:00+09:00",
      },
    ]);
    mockFetchEventContexts.mockResolvedValue([
      {
        id: "physical-event",
        start: "2026-06-22T11:00:00+09:00",
        end: "2026-06-22T11:30:00+09:00",
        summary: "Client visit",
        location: "Tokyo office",
        hasConference: false,
      },
    ]);
    generateTextMock.mockRejectedValue(new Error("OpenRouter unavailable"));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the shared model and falls back to physical travel padding", async () => {
    const result = await findSlotsInRange(
      "2026-06-22",
      "2026-06-22",
      cfg(),
      new Date("2026-06-22T00:00:00+09:00"),
    );

    expect(createSchedulingModelMock).toHaveBeenCalledWith("test-openrouter-key");
    expect(generateTextMock).toHaveBeenCalledTimes(1);
    const request = generateTextMock.mock.calls[0][0] as {
      model: unknown;
    };
    expect(request.model).toBe(modelMock);
    const unsupportedOption = ["temp", "erature"].join("");
    expect(request).not.toHaveProperty(unsupportedOption);
    expect(result.slots.map((slot) => slot.label)).not.toContain("11:30");
    expect(result.slots.map((slot) => slot.label)).toContain("12:30");
  });

  it("uses successful structured output from the shared OpenRouter model", async () => {
    generateTextMock.mockResolvedValue({
      output: {
        decisions: [
          {
            eventId: "online-event",
            needsTravel: true,
            confidence: "high",
            reasonCode: "physical_location",
          },
        ],
      },
    });

    mockFetchEventContexts.mockResolvedValue([
      {
        id: "online-event",
        start: "2026-06-22T11:00:00+09:00",
        end: "2026-06-22T11:30:00+09:00",
        summary: "Remote conference at an offsite venue",
        location: "Tokyo office",
        hasConference: true,
      },
    ]);

    const result = await findSlotsInRange(
      "2026-06-22",
      "2026-06-22",
      cfg(),
      new Date("2026-06-22T00:00:00+09:00"),
    );

    const request = generateTextMock.mock.calls[0][0] as {
      model: unknown;
      output: unknown;
      prompt: string;
      system: string;
    };
    expect(request.model).toBe(modelMock);
    expect(request.output).toBeDefined();
    expect(request.system).toContain("privacy-preserving calendar travel classifier");
    expect(request.prompt).toContain("online-event");
    const unsupportedOption = ["temp", "erature"].join("");
    expect(request).not.toHaveProperty(unsupportedOption);
    expect(result.slots.map((slot) => slot.label)).not.toContain("11:30");
    expect(result.slots.map((slot) => slot.label)).toContain("12:30");
  });
});
