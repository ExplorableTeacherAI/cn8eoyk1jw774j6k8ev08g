import { useRef, type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import {
    EditableH2,
    EditableParagraph,
    InlineClozeInput,
    InlineFeedback,
    InlineLinkedHighlight,
    InlineSpotColor,
    InlineToggle,
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import {
    getVariableInfo,
    clozePropsFromDefinition,
    linkedHighlightPropsFromDefinition,
    spotColorPropsFromDefinition,
    togglePropsFromDefinition,
} from "../variables";

// ── Domain model ─────────────────────────────────────────────────────────────

const FACES = 6;
const TRUE_OUTCOMES = FACES * FACES; // 36
const EMPTY_MASK = "0".repeat(TRUE_OUTCOMES);

const TARGETS = ["1/6", "1/4", "1/3", "1/2"] as const;
const TARGET_SQUARES: Record<string, number> = { "1/6": 6, "1/4": 9, "1/3": 12, "1/2": 18 };

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

const fractionText = (count: number) => {
    if (count === 0) return `P = 0`;
    const divisor = gcd(count, TRUE_OUTCOMES);
    if (divisor === 1) return `P = ${count}/${TRUE_OUTCOMES}`;
    return `P = ${count}/${TRUE_OUTCOMES} = ${count / divisor}/${TRUE_OUTCOMES / divisor}`;
};

const countOnes = (mask: string) => {
    let total = 0;
    for (let i = 0; i < mask.length; i += 1) if (mask[i] === "1") total += 1;
    return total;
};

// ── View geometry ────────────────────────────────────────────────────────────

const VIEWBOX_WIDTH = 560;
const VIEWBOX_HEIGHT = 440;
const CELL = 40;
const STEP = 44;
const GRID_LEFT = 76;
const GRID_TOP = 100;
const GRID_SPAN = (FACES - 1) * STEP + CELL; // 260
const CHIP_LEFT = 140;
const CHIP_WIDTH = 56;
const CHIP_GAP = 12;
const TRACK_LEFT = 76;
const TRACK_WIDTH = 424;
const TRACK_Y = 384;
const READOUT_X = 356;

const cellX = (col: number) => GRID_LEFT + col * STEP;
const cellY = (row: number) => GRID_TOP + row * STEP;
const chipX = (i: number) => CHIP_LEFT + i * (CHIP_WIDTH + CHIP_GAP);
const trackX = (squares: number) => TRACK_LEFT + (squares / TRUE_OUTCOMES) * TRACK_WIDTH;

const INK = "#334155";
const INK_SOFT = "#64748B";
const RULE = "#CBD5E1";
const FAINT = "#E2E8F0";
const ACCENT = "#62D0AD";
const HIGHLIGHT = "#6366f1";
const SUCCESS = "#22c55e";
const SHADED = "#62CCF9"; // soft sky: the squares the student has shaded

const DOUBLE_FOUR = 3 * FACES + 3; // the square where both dice show 4

// ── The figure ───────────────────────────────────────────────────────────────

function EventShadingDrawing() {
    const setVar = useSetVar();
    const mask = useVar<string>("shadedMask", EMPTY_MASK);
    const target = useVar<string>("targetProbability", "1/3");
    const highlight = useVar<string>("eventGridHighlight", "");

    const painting = useRef(false);
    const paintValue = useRef(true);

    const shaded = countOnes(mask);
    const targetSquares = TARGET_SQUARES[target] ?? 12;
    const matched = shaded === targetSquares;
    const remaining = targetSquares - shaded;

    const applyPaint = (index: number, value: boolean) => {
        const next = `${mask.slice(0, index)}${value ? "1" : "0"}${mask.slice(index + 1)}`;
        if (next === mask) return;
        setVar("shadedMask", next);
        setVar("shadedCount", countOnes(next));
    };

    const isTarget = (row: number, col: number, index: number) =>
        (highlight === "at-least-one-four" && (row === 3 || col === 3)) ||
        (highlight === "double-four" && index === DOUBLE_FOUR);

    const recede = highlight ? 0.35 : 1;
    const ease = { transition: "opacity 150ms ease-out" } as const;

    return (
        <svg
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
            className="block w-full"
            role="img"
            aria-label="A grid of every dice roll with a target probability to reach by shading squares"
            onPointerUp={() => {
                painting.current = false;
            }}
            onPointerLeave={() => {
                painting.current = false;
            }}
        >
            {/* ── Target chips ── */}
            <g opacity={recede} style={ease}>
                <text x={76} y={42} fontSize={12} fill={INK_SOFT}>
                    Target
                </text>
                {TARGETS.map((option, i) => {
                    const active = option === target;
                    return (
                        <g
                            key={option}
                            style={{ cursor: "pointer" }}
                            onClick={() => setVar("targetProbability", option)}
                        >
                            <rect
                                x={chipX(i)}
                                y={22}
                                width={CHIP_WIDTH}
                                height={26}
                                rx={8}
                                fill={active ? ACCENT : "#FFFFFF"}
                                fillOpacity={active ? 0.22 : 1}
                                stroke={active ? ACCENT : RULE}
                                strokeWidth={active ? 2.5 : 1.5}
                            />
                            <text
                                x={chipX(i) + CHIP_WIDTH / 2}
                                y={39}
                                fontSize={12}
                                textAnchor="middle"
                                fill={active ? INK : INK_SOFT}
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                {option}
                            </text>
                        </g>
                    );
                })}
            </g>

            {/* ── Axis labels ── */}
            <g opacity={recede} style={ease}>
                <text x={GRID_LEFT + GRID_SPAN / 2} y={70} fontSize={12} fill={INK_SOFT} textAnchor="middle">
                    Second die
                </text>
                <text
                    x={44}
                    y={GRID_TOP + GRID_SPAN / 2}
                    fontSize={12}
                    fill={INK_SOFT}
                    textAnchor="middle"
                    transform={`rotate(-90 44 ${GRID_TOP + GRID_SPAN / 2})`}
                >
                    First die
                </text>
                {Array.from({ length: FACES }, (_, j) => (
                    <text key={`col-${j}`} x={cellX(j) + CELL / 2} y={90} fontSize={11} fill={INK_SOFT} textAnchor="middle">
                        {j + 1}
                    </text>
                ))}
                {Array.from({ length: FACES }, (_, i) => (
                    <text key={`row-${i}`} x={GRID_LEFT - 12} y={cellY(i) + CELL / 2 + 4} fontSize={11} fill={INK_SOFT} textAnchor="end">
                        {i + 1}
                    </text>
                ))}
            </g>

            {/* ── The 36 squares: click or drag across to shade ── */}
            {Array.from({ length: TRUE_OUTCOMES }, (_, index) => {
                const row = Math.floor(index / FACES);
                const col = index % FACES;
                const on = mask[index] === "1";
                const target4 = isTarget(row, col, index);
                const x = cellX(col);
                const y = cellY(row);
                return (
                    <g key={`cell-${index}`} opacity={highlight && !target4 ? 0.35 : 1} style={ease}>
                        {target4 && (
                            <rect
                                x={x - 3}
                                y={y - 3}
                                width={CELL + 6}
                                height={CELL + 6}
                                rx={8}
                                fill="none"
                                stroke={HIGHLIGHT}
                                strokeWidth={7}
                                opacity={0.28}
                            />
                        )}
                        <rect
                            x={x}
                            y={y}
                            width={CELL}
                            height={CELL}
                            rx={5}
                            fill={on ? SHADED : "#FFFFFF"}
                            fillOpacity={on ? 0.3 : 1}
                            stroke={target4 ? HIGHLIGHT : on ? SHADED : RULE}
                            strokeWidth={target4 ? 3.5 : on ? 2.5 : 1.5}
                            style={{ cursor: "pointer", transition: "stroke-width 150ms ease-out" }}
                            onPointerDown={(event) => {
                                if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
                                    event.currentTarget.releasePointerCapture(event.pointerId);
                                }
                                painting.current = true;
                                paintValue.current = !on;
                                applyPaint(index, !on);
                            }}
                            onPointerEnter={() => {
                                if (painting.current) applyPaint(index, paintValue.current);
                                else if (index === DOUBLE_FOUR) setVar("eventGridHighlight", "double-four");
                            }}
                            onPointerLeave={() => {
                                if (!painting.current && index === DOUBLE_FOUR) setVar("eventGridHighlight", "");
                            }}
                        />
                    </g>
                );
            })}

            {/* ── Live readout beside the grid ── */}
            <g opacity={recede} style={ease}>
                <text x={READOUT_X} y={126} fontSize={13} fill={INK} style={{ fontVariantNumeric: "tabular-nums" }}>
                    {`Target: ${target}`}
                </text>
                <text x={READOUT_X} y={148} fontSize={12} fill={INK_SOFT} style={{ fontVariantNumeric: "tabular-nums" }}>
                    {`needs ${targetSquares} squares`}
                </text>
                <text x={READOUT_X} y={182} fontSize={13} fill={SHADED} style={{ fontVariantNumeric: "tabular-nums" }}>
                    {`Shaded: ${shaded} of ${TRUE_OUTCOMES}`}
                </text>
                <text x={READOUT_X} y={204} fontSize={12} fill={INK_SOFT} style={{ fontVariantNumeric: "tabular-nums" }}>
                    {fractionText(shaded)}
                </text>
                <text
                    x={READOUT_X}
                    y={238}
                    fontSize={12}
                    fill={matched ? SUCCESS : INK_SOFT}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {matched
                        ? "Matched the target"
                        : remaining > 0
                            ? `${remaining} more to shade`
                            : `${-remaining} too many`}
                </text>
            </g>

            {/* ── Progress track: the shaded count against the target notch ── */}
            <g opacity={recede} style={ease}>
                <text x={trackX(targetSquares)} y={372} fontSize={11} fill={INK_SOFT} textAnchor="middle">
                    target
                </text>
                <rect x={TRACK_LEFT} y={TRACK_Y} width={TRACK_WIDTH} height={12} rx={6} fill={FAINT} />
                <rect
                    x={TRACK_LEFT}
                    y={TRACK_Y}
                    width={Math.max(0, trackX(shaded) - TRACK_LEFT)}
                    height={12}
                    rx={6}
                    fill={matched ? SUCCESS : SHADED}
                    style={{ transition: "fill 150ms ease-out" }}
                />
                <line
                    x1={trackX(targetSquares)}
                    y1={TRACK_Y - 5}
                    x2={trackX(targetSquares)}
                    y2={TRACK_Y + 17}
                    stroke={INK}
                    strokeWidth={2}
                    strokeLinecap="round"
                />
                <text x={TRACK_LEFT - 6} y={406} fontSize={11} fill={INK_SOFT} textAnchor="end">
                    0
                </text>
                <text x={TRACK_LEFT + TRACK_WIDTH + 6} y={406} fontSize={11} fill={INK_SOFT}>
                    36
                </text>
            </g>
        </svg>
    );
}

function EventShadingFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="event-shading"
            caption="Pick a target probability, then click squares in the grid to shade them. The count and the fraction beside the grid update with every square, and the bar underneath shows how far you still are from the target notch."
            onReset={() => {
                setVar("shadedMask", EMPTY_MASK);
                setVar("shadedCount", 0);
                setVar("targetProbability", "1/3");
                setVar("eventGridHighlight", "");
            }}
        >
            <EventShadingDrawing />
            <InteractionHintSequence
                hintKey="event-shading-click"
                steps={[
                    {
                        gesture: "click",
                        label: "Click squares to shade them",
                        position: { x: "31%", y: "45%" },
                    },
                ]}
            />
        </Figure>
    );
}

function TargetSquareCount() {
    const target = useVar<string>("targetProbability", "1/3");
    return (
        <InlineSpotColor varName="targetProbability" {...spotColorPropsFromDefinition(getVariableInfo('targetProbability'))}>
            {TARGET_SQUARES[target] ?? 12}
        </InlineSpotColor>
    );
}

// ── Blocks ───────────────────────────────────────────────────────────────────

export const readingEventsOffTheGridBlocks: ReactElement[] = [
    <StackLayout key="layout-event-shading-heading" maxWidth="xl">
        <Block id="event-shading-heading" padding="md">
            <EditableH2 id="h2-event-shading-heading" blockId="event-shading-heading">
                Reading Any Event off the Grid
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-event-shading-setup" maxWidth="xl">
        <Block id="event-shading-setup" padding="sm">
            <EditableParagraph id="para-event-shading-setup" blockId="event-shading-setup">
                Totals are only one kind of event. You might want both dice even, or at least
                one four, or the two faces differing by exactly two. Click squares in the grid
                to shade them until the shaded fraction hits the target above it.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-event-shading-visual" maxWidth="xl">
        <Block id="event-shading-visual" padding="sm" hasVisualization>
            <EventShadingFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-event-shading-counting" maxWidth="xl">
        <Block id="event-shading-counting" padding="sm">
            <EditableParagraph id="para-event-shading-counting" blockId="event-shading-counting">
                Once an event is a set of outcomes, its probability is a count: how many
                outcomes belong to it, over thirty-six.{" "}
                <InlineLinkedHighlight
                    varName="eventGridHighlight"
                    highlightId="at-least-one-four"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('eventGridHighlight'))}
                >
                    At least one four
                </InlineLinkedHighlight>
                {" "}covers eleven of them, so its probability is eleven thirty-sixths. Not
                ten, because{" "}
                <InlineLinkedHighlight
                    varName="eventGridHighlight"
                    highlightId="double-four"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('eventGridHighlight'))}
                >
                    the double four
                </InlineLinkedHighlight>
                {" "}belongs to the event exactly once.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-event-shading-same-job" maxWidth="xl">
        <Block id="event-shading-same-job" padding="sm">
            <EditableParagraph id="para-event-shading-same-job" blockId="event-shading-same-job">
                A probability of{" "}
                <InlineToggle
                    id="toggle-target-probability"
                    varName="targetProbability"
                    options={["1/6", "1/4", "1/3", "1/2"]}
                    {...togglePropsFromDefinition(getVariableInfo('targetProbability'))}
                />
                {" "}means <TargetSquareCount /> of the thirty-six squares, so counting squares
                and stating a probability are the same job.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-event-shading-question-even" maxWidth="xl">
        <Block id="event-shading-question-even" padding="md">
            <EditableParagraph id="para-event-shading-question-even" blockId="event-shading-question-even">
                Of the thirty-six outcomes, the number where both dice show an even number is{" "}
                <InlineFeedback
                    varName="answerBothEven"
                    correctValue={["9", "nine"]}
                    position="terminal"
                    successMessage="— yes, three even faces on the first die and three on the second gives 3 by 3"
                    failureMessage="— not quite."
                    hint="Each die has three even faces, and any of them can pair with any of the others"
                    reviewBlockId="event-shading-counting"
                    reviewLabel="Review counting an event"
                    visualizationHint={{
                        blockId: "event-shading-visual",
                        hintKey: "feedback-event-both-even",
                        label: "Discover it yourself",
                        resetVars: { shadedMask: EMPTY_MASK, shadedCount: 0, eventGridHighlight: "" },
                        steps: [
                            {
                                gesture: "click",
                                label: "Shade every square where both dice are even, then read the count",
                                position: { x: "31%", y: "45%" },
                                completionVar: "shadedCount",
                                completionValue: 9,
                                completionTolerance: 0,
                            },
                        ],
                    }}
                >
                    <InlineClozeInput
                        varName="answerBothEven"
                        correctAnswer={["9", "nine"]}
                        {...clozePropsFromDefinition(getVariableInfo('answerBothEven'))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-event-shading-question-differ" maxWidth="xl">
        <Block id="event-shading-question-differ" padding="md">
            <EditableParagraph id="para-event-shading-question-differ" blockId="event-shading-question-differ">
                Of the thirty-six outcomes, the number where the two faces differ by exactly
                two is{" "}
                <InlineFeedback
                    varName="answerDifferByTwo"
                    correctValue={["8", "eight"]}
                    position="terminal"
                    successMessage="— exactly: 1 with 3, 2 with 4, 3 with 5, 4 with 6, and the same four the other way round"
                    failureMessage="— close, but count again."
                    hint="Find the pairs that differ by two, then remember each one can happen either way round"
                    reviewBlockId="outcome-grid-order-matters"
                    reviewLabel="Review why order counts"
                    visualizationHint={{
                        blockId: "event-shading-visual",
                        hintKey: "feedback-event-differ-by-two",
                        label: "Discover it yourself",
                        resetVars: { shadedMask: EMPTY_MASK, shadedCount: 0, eventGridHighlight: "" },
                        steps: [
                            {
                                gesture: "click",
                                label: "Shade every square whose two faces differ by two, then read the count",
                                position: { x: "31%", y: "45%" },
                                completionVar: "shadedCount",
                                completionValue: 8,
                                completionTolerance: 0,
                            },
                        ],
                    }}
                >
                    <InlineClozeInput
                        varName="answerDifferByTwo"
                        correctAnswer={["8", "eight"]}
                        {...clozePropsFromDefinition(getVariableInfo('answerDifferByTwo'))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-block-1787923630295" maxWidth="xl">
        <Block id="block-1787923630295" padding="sm">
            <EditableParagraph id="para-block-1787923630295" blockId="block-1787923630295">What is the probability of the dice showing an even number on the 1st roll and an odd number on the 2nd row?</EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-block-1787923679537" maxWidth="xl">
        <Block id="block-1787923679537" padding="sm">
            <EditableParagraph id="para-block-1787923679537" blockId="block-1787923679537">Is there a difference if the question is swapped around? (I.E. Show an odd number on the 1st roll and an even number on the 2nd roll)</EditableParagraph>
        </Block>
    </StackLayout>,
];
