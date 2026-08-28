import { useRef, useState, type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import {
    EditableH2,
    EditableParagraph,
    InlineClozeChoice,
    InlineClozeInput,
    InlineFeedback,
    InlineLinkedHighlight,
    InlineScrubbleNumber,
    InlineSpotColor,
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure } from "@/components/molecules";
import { useVar, useSetVar, useVariableStore } from "@/stores";
import { clamp, useSpring } from "@/lib/motion";
import {
    getVariableInfo,
    choicePropsFromDefinition,
    clozePropsFromDefinition,
    linkedHighlightPropsFromDefinition,
    numberPropsFromDefinition,
    spotColorPropsFromDefinition,
} from "../variables";

// ── Domain model ─────────────────────────────────────────────────────────────

const FACES = 6;
const TRUE_OUTCOMES = FACES * FACES; // 36
const MIN_TOTAL = 2;
const MAX_TOTAL = 12;
const TOTALS = Array.from({ length: MAX_TOTAL - MIN_TOTAL + 1 }, (_, i) => MIN_TOTAL + i);

/** How many of the 36 ordered rolls add up to `total`. */
const waysFor = (total: number) => Math.max(0, FACES - Math.abs(total - (FACES + 1)));

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

const probabilityText = (count: number) => {
    const divisor = gcd(count, TRUE_OUTCOMES);
    if (divisor === 1) return `P = ${count}/${TRUE_OUTCOMES}`;
    return `P = ${count}/${TRUE_OUTCOMES} = ${count / divisor}/${TRUE_OUTCOMES / divisor}`;
};

const bitFor = (total: number) => 1 << (total - MIN_TOTAL);

// ── View geometry ────────────────────────────────────────────────────────────

const VIEWBOX_WIDTH = 560;
const VIEWBOX_HEIGHT = 430;
const CELL = 38;
const STEP = 42;
const GRID_LEFT = 150;
const GRID_TOP = 64;
const GRID_SPAN = (FACES - 1) * STEP + CELL; // 248
const AXIS_Y = 366;
const AXIS_LEFT = GRID_LEFT;
const AXIS_GAP = GRID_SPAN / (MAX_TOTAL - MIN_TOTAL); // 24.8
const LABEL_Y = 386;
const MARKER_Y = 404;
const READOUT_X = 418;

const cellX = (col: number) => GRID_LEFT + col * STEP;
const cellY = (row: number) => GRID_TOP + row * STEP;
const totalX = (total: number) => AXIS_LEFT + (total - MIN_TOTAL) * AXIS_GAP;

const INK = "#334155";
const INK_SOFT = "#64748B";
const RULE = "#CBD5E1";
const FAINT = "#E2E8F0";
const ACCENT = "#62D0AD";
const HIGHLIGHT = "#6366f1";

// ── The figure ───────────────────────────────────────────────────────────────

function TotalsStripeDrawing() {
    const setVar = useSetVar();
    const chosenTotal = useVar<number>("chosenTotal", MIN_TOTAL);
    const visited = useVar<number>("visitedTotals", 1);
    const highlight = useVar<string>("sevenWinsHighlight", "");

    const [dragging, setDragging] = useState(false);
    const [markerHovered, setMarkerHovered] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);

    const markerScale = useSpring(dragging || markerHovered ? 1.18 : 1, {
        stiffness: 400,
        damping: 26,
    });

    const litCount = waysFor(chosenTotal);

    const isTarget = (sum: number) =>
        (highlight === "total-7" && sum === 7) ||
        (highlight === "total-ends" && (sum === MIN_TOTAL || sum === MAX_TOTAL));

    const recede = highlight ? 0.35 : 1;
    const ease = { transition: "opacity 150ms ease-out" } as const;

    const chooseFromPointer = (clientX: number) => {
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * VIEWBOX_WIDTH;
        const next = clamp(Math.round((x - AXIS_LEFT) / AXIS_GAP) + MIN_TOTAL, MIN_TOTAL, MAX_TOTAL);
        if (next === chosenTotal) return;
        setVar("chosenTotal", next);
        const mask = (useVariableStore.getState().variables.visitedTotals as number) ?? 1;
        setVar("visitedTotals", mask | bitFor(next));
    };

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
            className="block w-full"
            role="img"
            aria-label="A grid of every dice roll with the squares for one chosen total lit as a stripe"
        >
            <defs>
                <filter id="totals-marker-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.25" />
                </filter>
            </defs>

            {/* ── Axis labels around the grid ── */}
            <g opacity={recede} style={ease}>
                <text x={GRID_LEFT + GRID_SPAN / 2} y={32} fontSize={12} fill={INK_SOFT} textAnchor="middle">
                    Second die
                </text>
                <text
                    x={112}
                    y={GRID_TOP + GRID_SPAN / 2}
                    fontSize={12}
                    fill={INK_SOFT}
                    textAnchor="middle"
                    transform={`rotate(-90 112 ${GRID_TOP + GRID_SPAN / 2})`}
                >
                    First die
                </text>
                {Array.from({ length: FACES }, (_, j) => (
                    <text key={`col-${j}`} x={cellX(j) + CELL / 2} y={54} fontSize={11} fill={INK_SOFT} textAnchor="middle">
                        {j + 1}
                    </text>
                ))}
                {Array.from({ length: FACES }, (_, i) => (
                    <text key={`row-${i}`} x={GRID_LEFT - 12} y={cellY(i) + CELL / 2 + 4} fontSize={11} fill={INK_SOFT} textAnchor="end">
                        {i + 1}
                    </text>
                ))}
            </g>

            {/* ── The 36 squares, each showing its total ── */}
            {Array.from({ length: TRUE_OUTCOMES }, (_, index) => {
                const row = Math.floor(index / FACES);
                const col = index % FACES;
                const sum = row + col + 2;
                const lit = sum === chosenTotal;
                const target = isTarget(sum);
                const x = cellX(col);
                const y = cellY(row);
                const boundPhrase = sum === 7 ? "total-7" : sum === MIN_TOTAL || sum === MAX_TOTAL ? "total-ends" : "";
                return (
                    <g key={`cell-${index}`} opacity={highlight && !target ? 0.35 : 1} style={ease}>
                        {target && (
                            <rect
                                x={x - 3}
                                y={y - 3}
                                width={CELL + 6}
                                height={CELL + 6}
                                rx={7}
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
                            rx={4}
                            fill={lit ? ACCENT : "#FFFFFF"}
                            fillOpacity={lit ? 0.25 : 1}
                            stroke={target ? HIGHLIGHT : lit ? ACCENT : RULE}
                            strokeWidth={target ? 3.5 : lit ? 2.5 : 1.5}
                            style={{ transition: "stroke-width 150ms ease-out" }}
                        />
                        <text
                            x={x + CELL / 2}
                            y={y + CELL / 2 + 4}
                            fontSize={12}
                            textAnchor="middle"
                            fill={lit || target ? INK : "#94A3B8"}
                            style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                            {sum}
                        </text>
                        <rect
                            x={x}
                            y={y}
                            width={CELL}
                            height={CELL}
                            rx={4}
                            fill="transparent"
                            style={{ cursor: boundPhrase ? "pointer" : "default" }}
                            onPointerEnter={() => boundPhrase && setVar("sevenWinsHighlight", boundPhrase)}
                            onPointerLeave={() => boundPhrase && setVar("sevenWinsHighlight", "")}
                        />
                    </g>
                );
            })}

            {/* ── Live readout beside the grid ── */}
            <g opacity={recede} style={ease}>
                <text x={READOUT_X} y={92} fontSize={13} fill={INK} style={{ fontVariantNumeric: "tabular-nums" }}>
                    {`Total: ${chosenTotal}`}
                </text>
                <text x={READOUT_X} y={114} fontSize={12} fill={ACCENT} style={{ fontVariantNumeric: "tabular-nums" }}>
                    {`${litCount} of ${TRUE_OUTCOMES} squares`}
                </text>
                <text x={READOUT_X} y={136} fontSize={12} fill={INK_SOFT} style={{ fontVariantNumeric: "tabular-nums" }}>
                    {probabilityText(litCount)}
                </text>
            </g>

            {/* ── The row of totals, with a record of the ones already visited ── */}
            <g opacity={recede} style={ease}>
                {TOTALS.map((total) => {
                    const seen = (visited & bitFor(total)) !== 0;
                    const barHeight = seen ? waysFor(total) * 8 : 3;
                    const current = total === chosenTotal;
                    return (
                        <rect
                            key={`bar-${total}`}
                            x={totalX(total) - 8}
                            y={AXIS_Y - barHeight}
                            width={16}
                            height={barHeight}
                            rx={2}
                            fill={seen ? ACCENT : FAINT}
                            fillOpacity={seen ? (current ? 1 : 0.4) : 1}
                            style={{ transition: "fill-opacity 150ms ease-out" }}
                        />
                    );
                })}
                <line x1={AXIS_LEFT - 14} y1={AXIS_Y} x2={totalX(MAX_TOTAL) + 14} y2={AXIS_Y} stroke={INK_SOFT} strokeWidth={2} strokeLinecap="round" />
                <rect
                    x={totalX(chosenTotal) - 11}
                    y={LABEL_Y - 12}
                    width={22}
                    height={16}
                    rx={4}
                    fill={ACCENT}
                    fillOpacity={0.2}
                />
                {TOTALS.map((total) => (
                    <text
                        key={`tick-${total}`}
                        x={totalX(total)}
                        y={LABEL_Y}
                        fontSize={11}
                        textAnchor="middle"
                        fill={total === chosenTotal ? INK : INK_SOFT}
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {total}
                    </text>
                ))}
                <g transform={`translate(${totalX(chosenTotal)} ${MARKER_Y}) scale(${markerScale})`}>
                    <circle r={11} fill={ACCENT} filter="url(#totals-marker-shadow)" />
                    <path d="M -4.5 0 L 4.5 0" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" />
                </g>
                <rect
                    x={AXIS_LEFT - 20}
                    y={MARKER_Y - 22}
                    width={GRID_SPAN + 40}
                    height={44}
                    fill="transparent"
                    style={{ cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
                    onPointerDown={(event) => {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        setDragging(true);
                        chooseFromPointer(event.clientX);
                    }}
                    onPointerMove={(event) => {
                        if (!dragging) return;
                        chooseFromPointer(event.clientX);
                    }}
                    onPointerUp={() => setDragging(false)}
                    onPointerEnter={() => setMarkerHovered(true)}
                    onPointerLeave={() => setMarkerHovered(false)}
                />
            </g>
        </svg>
    );
}

function TotalsStripeFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="totals-stripe"
            caption="Drag the teal marker along the row of totals. The squares that make your total light up as a diagonal stripe, and every total you land on leaves a bar behind so the shape builds up as you go."
            onReset={() => {
                setVar("chosenTotal", MIN_TOTAL);
                setVar("visitedTotals", 1);
                setVar("sevenWinsHighlight", "");
            }}
        >
            <TotalsStripeDrawing />
            <InteractionHintSequence
                hintKey="totals-stripe-drag"
                steps={[
                    {
                        gesture: "drag-horizontal",
                        label: "Drag the marker across the totals",
                        position: { x: "27%", y: "88%" },
                        dragPath: { type: "line", startOffset: { x: -6, y: 0 }, endOffset: { x: 44, y: 0 } },
                    },
                ]}
            />
        </Figure>
    );
}

function WaysForChosenTotal() {
    const chosenTotal = useVar<number>("chosenTotal", MIN_TOTAL);
    const count = waysFor(chosenTotal);
    return (
        <InlineSpotColor varName="chosenTotal" {...spotColorPropsFromDefinition(getVariableInfo('chosenTotal'))}>
            {count} {count === 1 ? "way" : "ways"}
        </InlineSpotColor>
    );
}

// ── Blocks ───────────────────────────────────────────────────────────────────

export const whySevenWinsBlocks: ReactElement[] = [
    <StackLayout key="layout-seven-wins-heading" maxWidth="xl">
        <Block id="seven-wins-heading" padding="md">
            <EditableH2 id="h2-seven-wins-heading" blockId="seven-wins-heading">
                Why Seven Wins
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-seven-wins-setup" maxWidth="xl">
        <Block id="seven-wins-setup" padding="sm">
            <EditableParagraph id="para-seven-wins-setup" blockId="seven-wins-setup">
                There are eleven possible totals, from two up to twelve. It is tempting to treat
                them as eleven equal options, the way the six faces of one die are equal. Drag
                the teal marker along the row of totals and watch the lit stripe swell and
                shrink.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-seven-wins-visual" maxWidth="xl">
        <Block id="seven-wins-visual" padding="sm" hasVisualization>
            <TotalsStripeFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-seven-wins-count" maxWidth="xl">
        <Block id="seven-wins-count" padding="sm">
            <EditableParagraph id="para-seven-wins-count" blockId="seven-wins-count">
                A total of{" "}
                <InlineScrubbleNumber
                    varName="chosenTotal"
                    {...numberPropsFromDefinition(getVariableInfo('chosenTotal'))}
                />
                {" "}can happen in <WaysForChosenTotal /> out of the thirty-six, and that count
                changes from one total to the next. Seven sits on{" "}
                <InlineLinkedHighlight
                    varName="sevenWinsHighlight"
                    highlightId="total-7"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('sevenWinsHighlight'))}
                >
                    the longest stripe
                </InlineLinkedHighlight>
                {" "}with six squares behind it, while{" "}
                <InlineLinkedHighlight
                    varName="sevenWinsHighlight"
                    highlightId="total-ends"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('sevenWinsHighlight'))}
                >
                    two and twelve
                </InlineLinkedHighlight>
                {" "}have a single square each.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-seven-wins-insight" maxWidth="xl">
        <Block id="seven-wins-insight" padding="sm">
            <EditableParagraph id="para-seven-wins-insight" blockId="seven-wins-insight">
                So totals are not outcomes. They are groups of outcomes, and the groups come in
                very different sizes.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-seven-wins-question-five" maxWidth="xl">
        <Block id="seven-wins-question-five" padding="md">
            <EditableParagraph id="para-seven-wins-question-five" blockId="seven-wins-question-five">
                Out of the thirty-six outcomes, the number that give a total of five is{" "}
                <InlineFeedback
                    varName="answerWaysToFive"
                    correctValue={["4", "four"]}
                    position="terminal"
                    successMessage="— yes: 1 with 4, 2 with 3, 3 with 2 and 4 with 1, so four squares on that stripe"
                    failureMessage="— not quite."
                    hint="Count the pairs that add to five, remembering which die gave which face"
                    reviewBlockId="seven-wins-count"
                    reviewLabel="Review counting a stripe"
                    visualizationHint={{
                        blockId: "seven-wins-visual",
                        hintKey: "feedback-totals-five",
                        label: "Discover it yourself",
                        resetVars: { chosenTotal: 2, visitedTotals: 1, sevenWinsHighlight: "" },
                        steps: [
                            {
                                gesture: "drag-horizontal",
                                label: "Drag the marker along to the total five, then count the lit squares",
                                position: { x: "34%", y: "86%" },
                                completionVar: "chosenTotal",
                                completionValue: 5,
                                completionTolerance: 0,
                            },
                        ],
                    }}
                >
                    <InlineClozeInput
                        varName="answerWaysToFive"
                        correctAnswer={["4", "four"]}
                        {...clozePropsFromDefinition(getVariableInfo('answerWaysToFive'))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-seven-wins-question-compare" maxWidth="xl">
        <Block id="seven-wins-question-compare" padding="md">
            <EditableParagraph id="para-seven-wins-question-compare" blockId="seven-wins-question-compare">
                Between a total of six and a total of eleven, the more likely one is{" "}
                <InlineFeedback
                    varName="answerSixOrEleven"
                    correctValue="a total of six"
                    position="terminal"
                    successMessage="— right, six sits on a stripe of five squares while eleven has only two"
                    failureMessage="— have another look."
                    hint="The totals are groups of squares, and the groups are not the same size"
                    reviewBlockId="seven-wins-insight"
                    reviewLabel="Review why totals differ"
                    visualizationHint={{
                        blockId: "seven-wins-visual",
                        hintKey: "feedback-totals-compare",
                        label: "Discover it yourself",
                        resetVars: { chosenTotal: 2, visitedTotals: 1, sevenWinsHighlight: "" },
                        steps: [
                            {
                                gesture: "drag-horizontal",
                                label: "Drag the marker to six and count the lit squares",
                                position: { x: "38%", y: "86%" },
                                completionVar: "chosenTotal",
                                completionValue: 6,
                                completionTolerance: 0,
                            },
                            {
                                gesture: "drag-horizontal",
                                label: "Now carry on to eleven and count again",
                                position: { x: "68%", y: "86%" },
                                completionVar: "chosenTotal",
                                completionValue: 11,
                                completionTolerance: 0,
                            },
                        ],
                    }}
                >
                    <InlineClozeChoice
                        varName="answerSixOrEleven"
                        correctAnswer="a total of six"
                        options={["a total of six", "a total of eleven", "they are equally likely"]}
                        {...choicePropsFromDefinition(getVariableInfo('answerSixOrEleven'))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
