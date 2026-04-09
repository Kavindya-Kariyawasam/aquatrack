"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { formatDate } from "@/lib/utils";

type Role = "swimmer" | "coach" | "admin";

type TrainingSet = {
  _id: string;
  type: "swimming" | "land";
  date: string;
  content: string;
  postedByName: string;
  isAIGenerated?: boolean;
  isPrivate?: boolean;
  assignedToUserName?: string;
};

type SetRequest = {
  _id: string;
  userName: string;
  type: "swimming" | "land";
  message: string;
  status: "pending" | "approved" | "fulfilled";
  response?: string;
  createdAt: string;
};

type SettingsResponse = {
  settings?: {
    holidays?: Array<{
      date: string;
      reason?: string;
      sessionType: "swimming" | "land" | "none";
    }>;
  };
};

function toIsoDate(value: Date | string): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    const datePrefixMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (datePrefixMatch) {
      return datePrefixMatch[1];
    }
  }

  return new Date(value).toISOString().slice(0, 10);
}

function monthGrid(month: string): Array<string | null> {
  if (!/^\d{4}-\d{2}$/.test(month)) return [];

  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;

  const firstOfMonth = new Date(year, monthIndex, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells: Array<string | null> = Array.from({ length: firstWeekday })
    .fill(null)
    .map(() => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${month}-${String(day).padStart(2, "0")}`);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export default function TrainingPage() {
  const [type, setType] = useState<"swimming" | "land">("swimming");
  const [content, setContent] = useState("");
  const [focus, setFocus] = useState("");
  const [generated, setGenerated] = useState("");
  const [sets, setSets] = useState<TrainingSet[]>([]);
  const [availableSetDates, setAvailableSetDates] = useState<string[]>([]);
  const [role, setRole] = useState<Role>("swimmer");
  const [isRoleLoaded, setIsRoleLoaded] = useState(false);
  const [monthFilter, setMonthFilter] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [postDate, setPostDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [isPosting, setIsPosting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const [requestMessage, setRequestMessage] = useState("");
  const [requests, setRequests] = useState<SetRequest[]>([]);
  const [privateSet, setPrivateSet] = useState<TrainingSet | null>(null);
  const [privateSetDrafts, setPrivateSetDrafts] = useState<
    Record<string, string>
  >({});
  const [holidays, setHolidays] = useState<
    Array<{
      date: string;
      reason?: string;
      sessionType: "swimming" | "land" | "none";
    }>
  >([]);

  const canManageSets = useMemo(
    () => role === "coach" || role === "admin",
    [role],
  );
  const isManager = canManageSets;

  const loadSetRequests = useCallback(async () => {
    try {
      const response = await fetch("/api/set-requests");
      const data = await response.json();
      if (response.ok) {
        setRequests(data.requests || []);
      }
    } catch {
      toast.error("Failed to load set requests");
    }
  }, []);

  const loadSets = useCallback(async () => {
    try {
      const [meRes, setsRes, settingsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch(`/api/training-sets?type=${type}&month=${monthFilter}&limit=200`),
        fetch("/api/settings"),
      ]);

      const meData = await meRes.json();
      const setsData = await setsRes.json();
      const settingsData = (await settingsRes.json()) as SettingsResponse;

      if (meRes.ok && meData.user?.role) {
        setRole(meData.user.role as Role);
      }

      if (setsRes.ok) {
        setSets(setsData.sets || []);
        setAvailableSetDates(setsData.availableDates || []);
        setPrivateSet((setsData.privateSet || null) as TrainingSet | null);
      }

      if (settingsRes.ok && Array.isArray(settingsData?.settings?.holidays)) {
        setHolidays(
          settingsData.settings.holidays.map((holiday) => ({
            date: toIsoDate(holiday.date),
            reason: holiday.reason || "",
            sessionType: holiday.sessionType,
          })),
        );
      }
    } catch {
      toast.error("Failed to load training data");
    } finally {
      setIsRoleLoaded(true);
    }
  }, [monthFilter, type]);

  const onPostPrivateSet = async (requestId: string) => {
    const draft = String(privateSetDrafts[requestId] || "").trim();
    if (!draft) {
      toast.error("Write a private set first");
      return;
    }

    await onUpdateRequestStatus(requestId, "fulfilled", draft);
  };

  useEffect(() => {
    void loadSets();
  }, [loadSets]);

  useEffect(() => {
    void loadSetRequests();
  }, [loadSetRequests]);

  useEffect(() => {
    if (!selectedDate.startsWith(monthFilter)) {
      setSelectedDate(`${monthFilter}-01`);
    }
  }, [monthFilter, selectedDate]);

  useEffect(() => {
    if (!selectedDate.startsWith(monthFilter) && availableSetDates.length > 0) {
      setSelectedDate(availableSetDates[0]);
    }
  }, [availableSetDates, monthFilter, selectedDate]);

  const onPostSet = async () => {
    if (!content.trim()) {
      toast.error("Set content is required");
      return;
    }

    setIsPosting(true);

    try {
      const response = await fetch("/api/training-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content, date: postDate }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to post set");
        return;
      }

      toast.success("Training set posted");
      setContent("");
      await loadSets();
    } catch {
      toast.error("Network error while posting");
    } finally {
      setIsPosting(false);
    }
  };

  const onGenerateSet = async () => {
    setIsGenerating(true);
    setGenerated("");

    try {
      const response = await fetch("/api/training-sets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, focus }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to generate set");
        return;
      }

      setGenerated(data.content || "");
      toast.success("AI set generated");
    } catch {
      toast.error("Network error while generating");
    } finally {
      setIsGenerating(false);
    }
  };

  const onExtractText = async (file?: File) => {
    if (!file) return;

    setIsExtracting(true);
    try {
      const Tesseract = (await import("tesseract.js")).default;
      const result = await Tesseract.recognize(file, "eng");
      const extracted = result?.data?.text?.trim();
      if (!extracted) {
        toast.error("No text detected from image");
        return;
      }

      setContent((previous) =>
        previous ? `${previous}\n\n${extracted}` : extracted,
      );
      toast.success("Text extracted from image");
    } catch {
      toast.error("Failed to extract text from image");
    } finally {
      setIsExtracting(false);
    }
  };

  const onDropFile = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFile(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void onExtractText(file);
    }
  };

  const onCreateRequest = async () => {
    if (!requestMessage.trim()) {
      toast.error("Please enter what kind of set you need");
      return;
    }

    try {
      const response = await fetch("/api/set-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message: requestMessage }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to create set request");
        return;
      }

      toast.success("Set request submitted");
      setRequestMessage("");
      await loadSetRequests();
    } catch {
      toast.error("Network error while requesting set");
    }
  };

  const onUpdateRequestStatus = async (
    requestId: string,
    status: "pending" | "approved" | "fulfilled",
    personalSetContent = "",
  ) => {
    try {
      const response = await fetch("/api/set-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status, personalSetContent }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to update request");
        return;
      }

      toast.success(
        personalSetContent
          ? "Private set posted and request fulfilled"
          : "Request status updated",
      );
      if (personalSetContent) {
        setPrivateSetDrafts((prev) => ({ ...prev, [requestId]: "" }));
      }
      await Promise.all([loadSetRequests(), loadSets()]);
    } catch {
      toast.error("Network error while updating request");
    }
  };

  const cells = useMemo(() => monthGrid(monthFilter), [monthFilter]);

  const dateCountLookup = useMemo(() => {
    const map = new Map<string, number>();
    for (const set of sets) {
      const dayKey = toIsoDate(set.date);
      map.set(dayKey, (map.get(dayKey) || 0) + 1);
    }
    return map;
  }, [sets]);

  const selectedDateSets = useMemo(() => {
    return sets
      .filter((set) => toIsoDate(set.date) === selectedDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedDate, sets]);

  if (!isRoleLoaded) {
    return (
      <div className="space-y-6">
        <h1 className="section-heading">Training</h1>
        <Card>
          <p className="text-gray-400">Loading training workspace...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="mt-3 text-sm text-slate-600 dark:text-gray-400">
        Training Type applies to this whole page: calendar view, posted sets,
        requests, and AI generation.
      </p>
      <h1 className="section-heading">Training</h1>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Training Type"
            value={type}
            onChange={(event) =>
              setType(event.target.value as "swimming" | "land")
            }
            options={[
              { value: "swimming", label: "Swimming" },
              { value: "land", label: "Land / Dryland" },
            ]}
          />
          <Input
            label="Month"
            type="month"
            value={monthFilter}
            onChange={(event) => setMonthFilter(event.target.value)}
          />
          <Input
            label="AI Focus (optional)"
            value={focus}
            onChange={(event) => setFocus(event.target.value)}
            placeholder="e.g. sprint endurance"
          />
        </div>

        <div className="mt-4 flex gap-3 flex-wrap">
          <Button onClick={onGenerateSet} isLoading={isGenerating}>
            Generate AI Set
          </Button>
          <Button variant="secondary" onClick={() => setGenerated("")}>
            Clear Generated
          </Button>
        </div>

        {generated && (
          <div className="mt-4">
            <p className="text-primary-300 font-medium mb-2">Generated Set</p>
            <textarea
              className="input-field w-full min-h-48"
              value={generated}
              onChange={(event) => setGenerated(event.target.value)}
            />
            {canManageSets && (
              <div className="mt-3">
                <Button
                  onClick={async () => {
                    setContent(generated);
                    toast.success("Generated set copied to post form");
                  }}
                >
                  Use as Posted Set
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-primary-300 mb-3">
          Training Calendar
        </h2>
        <div className="grid grid-cols-7 gap-2 text-xs uppercase tracking-wide text-gray-400 mb-2">
          <p>Mon</p>
          <p>Tue</p>
          <p>Wed</p>
          <p>Thu</p>
          <p>Fri</p>
          <p>Sat</p>
          <p>Sun</p>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {cells.map((cellDate, index) => {
            if (!cellDate) {
              return (
                <div
                  key={`empty-${index}`}
                  className="h-20 rounded border border-transparent"
                />
              );
            }

            const count = dateCountLookup.get(cellDate) || 0;
            const isSelected = cellDate === selectedDate;
            const hasSet = count > 0;
            const holidayForDate = holidays.find(
              (holiday) =>
                holiday.date === cellDate &&
                (holiday.sessionType === "none" ||
                  holiday.sessionType === type),
            );

            return (
              <button
                key={cellDate}
                type="button"
                onClick={() => {
                  setSelectedDate(cellDate);
                  if (canManageSets) {
                    setPostDate(cellDate);
                  }
                }}
                title={
                  holidayForDate
                    ? `Holiday: ${holidayForDate.reason || "No reason provided"}`
                    : undefined
                }
                className={`h-20 rounded border p-2 text-left transition ${
                  isSelected
                    ? "border-primary-300 bg-primary-500/10"
                    : holidayForDate
                      ? "border-yellow-500/40 bg-yellow-500/10 hover:border-yellow-500/60"
                      : "border-primary-500/20 hover:border-primary-400"
                }`}
              >
                <p className="text-sm font-semibold text-slate-800 dark:text-gray-100">
                  {Number(cellDate.slice(-2))}
                </p>
                {holidayForDate && (
                  <p className="text-[10px] uppercase tracking-wide text-yellow-600 dark:text-yellow-300">
                    Holiday
                  </p>
                )}
                <p
                  className={`mt-1 text-xs ${
                    hasSet
                      ? "text-green-300"
                      : holidayForDate
                        ? "text-yellow-600 dark:text-yellow-300"
                        : "text-gray-500"
                  }`}
                >
                  {hasSet
                    ? `${count} set${count > 1 ? "s" : ""}`
                    : holidayForDate
                      ? "No practice"
                      : "No set"}
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      {!isManager && (
        <Card>
          <h2 className="text-xl font-semibold text-primary-300 mb-3">
            Request a Training Set
          </h2>
          <Input
            label="What do you need?"
            value={requestMessage}
            onChange={(event) => setRequestMessage(event.target.value)}
            placeholder="Example: short sprint-focused set for Friday"
          />
          <div className="mt-3">
            <Button onClick={onCreateRequest}>Submit Request</Button>
          </div>
        </Card>
      )}

      {!isManager && privateSet && (
        <Card>
          <h2 className="text-xl font-semibold text-primary-300 mb-3">
            My Private Set ({privateSet.type})
          </h2>
          <p className="text-xs text-slate-500 dark:text-gray-400 mb-2">
            Last updated by {privateSet.postedByName} on{" "}
            {formatDate(privateSet.date)}
          </p>
          <pre className="whitespace-pre-wrap text-sm text-slate-800 dark:text-gray-100 font-sans">
            {privateSet.content}
          </pre>
        </Card>
      )}

      {canManageSets && (
        <Card>
          <h2 className="text-xl font-semibold text-primary-300 mb-3">
            Post New Set
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <Input
              label="Set Date"
              type="date"
              value={postDate}
              onChange={(event) => setPostDate(event.target.value)}
            />
          </div>
          <textarea
            className="input-field w-full min-h-48"
            placeholder="Paste or write training set content..."
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />

          <div className="mt-4">
            <p className="text-sm text-gray-300 mb-2">
              Upload Image and Extract Text (OCR)
            </p>
            <div
              className={`rounded border border-dashed p-4 text-sm transition ${
                isDraggingFile
                  ? "border-primary-300 bg-primary-500/10"
                  : "border-primary-500/40"
              }`}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDraggingFile(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDraggingFile(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDraggingFile(false);
              }}
              onDrop={onDropFile}
            >
              <p className="text-gray-300 mb-2">
                Drag and drop an image here, or select a file below.
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  void onExtractText(event.target.files?.[0])
                }
                className="text-sm"
              />
            </div>
            {isExtracting && (
              <p className="text-xs text-primary-300 mt-2">
                Extracting text from image...
              </p>
            )}
          </div>

          <div className="mt-3">
            <Button onClick={onPostSet} isLoading={isPosting}>
              Post Set
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="text-xl font-semibold text-primary-300 mb-3">
          {isManager ? "Team" : "My"} Set Requests
        </h2>
        {requests.length === 0 ? (
          <p className="text-gray-400">No set requests yet.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request._id}
                className="border border-primary-500/20 rounded-lg p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <p className="text-sm text-gray-300">
                    {request.userName} · {request.type} ·{" "}
                    {formatDate(request.createdAt)}
                  </p>
                  <span className="text-xs uppercase text-primary-300">
                    {request.status}
                  </span>
                </div>
                <p className="text-sm text-gray-100">{request.message}</p>
                {request.response && (
                  <p className="text-xs text-gray-400 mt-1">
                    Response: {request.response}
                  </p>
                )}

                {isManager && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      className="input-field w-full min-h-28"
                      placeholder="Optional: write a private set for this swimmer. Posting will overwrite their previous private set of this type."
                      value={privateSetDrafts[request._id] || ""}
                      onChange={(event) =>
                        setPrivateSetDrafts((prev) => ({
                          ...prev,
                          [request._id]: event.target.value,
                        }))
                      }
                    />
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void onPostPrivateSet(request._id)}
                      >
                        Post Private Set
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          void onUpdateRequestStatus(request._id, "approved")
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          void onUpdateRequestStatus(request._id, "fulfilled")
                        }
                      >
                        Fulfilled
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() =>
                          void onUpdateRequestStatus(request._id, "pending")
                        }
                      >
                        Set Pending
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-primary-300 mb-3">
          Sets On {formatDate(selectedDate)} ({type})
        </h2>
        {selectedDateSets.length === 0 ? (
          <p className="text-gray-400">No sets posted for the selected date.</p>
        ) : (
          <div className="space-y-3">
            {selectedDateSets.map((set) => (
              <div
                key={set._id}
                className="border border-primary-500/20 rounded-lg p-4"
              >
                <div className="flex justify-between gap-2 mb-2">
                  <p className="text-sm text-gray-400">
                    {formatDate(set.date)} · by {set.postedByName}
                  </p>
                  {set.isAIGenerated && (
                    <span className="text-xs text-primary-300">
                      AI-assisted
                    </span>
                  )}
                </div>
                <pre className="whitespace-pre-wrap text-sm text-gray-100 font-sans">
                  {set.content}
                </pre>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
