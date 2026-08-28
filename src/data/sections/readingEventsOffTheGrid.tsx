import { type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import { EditableH2, EditableParagraph } from "@/components/atoms";
import { VisualOptionCards } from "@/components/organisms";

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
                one four, or the two faces differing by exactly two. Each of these is simply a
                particular set of the thirty-six outcomes.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <Block key="layout-event-shading-visual" id="event-shading-visual">
        <VisualOptionCards
            blockId="event-shading-visual"
            cards={[
                {
                    id: "paint-and-name",
                    title: "A blank grid of every roll with a sentence underneath that fills itself in",
                    looks: "Imagine the grid of all the rolls with every square empty, and an unfinished sentence sitting below it. As students paint squares in, the sentence works out what those squares have in common and states the fraction of the grid they cover.",
                    manipulate: "Paint squares of the grid and watch the description and the fraction rewrite themselves after every square",
                    reveals: "An event is just a set of squares, so its probability is nothing more than a count over thirty-six",
                    paradigm: "inversion",
                    recommended: true,
                },
                {
                    id: "hit-the-target-fraction",
                    title: "The grid of every roll with a target fraction printed above it",
                    looks: "Imagine the grid of all the rolls with a target such as one third written above it, and a running count of shaded squares below. Each square students shade nudges the count and its fraction upward, and the target stays in view the whole time.",
                    manipulate: "Shade squares one at a time until the fraction underneath matches the target exactly",
                    reveals: "A probability of one third means twelve of the thirty-six squares, so counting squares and stating a probability are the same job",
                    paradigm: "goal",
                },
                {
                    id: "grid-and-probability-line",
                    title: "The grid of every roll beside a line running from zero to one",
                    looks: "Imagine the grid of all the rolls on the left and a plain line marked zero at one end and one at the other on the right. A marker sits on that line, and it slides as squares are shaded or cleared, never straying past either end.",
                    manipulate: "Shade and clear squares in the grid and watch the marker crawl along the zero-to-one line",
                    reveals: "Every event lands somewhere between zero and one, and shading more squares can only push the marker to the right",
                    paradigm: "comparison",
                    secondView: {
                        shows: "A zero-to-one probability line with a marker at the shaded fraction",
                        role: "constraining",
                        syncedBy: "shadedSquares, plus a shared hover highlight linking the marker to the shaded region",
                    },
                },
            ]}
        />
    </Block>,

    <StackLayout key="layout-event-shading-counting" maxWidth="xl">
        <Block id="event-shading-counting" padding="sm">
            <EditableParagraph id="para-event-shading-counting" blockId="event-shading-counting">
                Once an event is a set of outcomes, its probability is a count: how many
                outcomes belong to it, over thirty-six. At least one four covers eleven of
                them, so its probability is eleven thirty-sixths. Not ten, and not twelve,
                because the double four belongs to the event exactly once.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
