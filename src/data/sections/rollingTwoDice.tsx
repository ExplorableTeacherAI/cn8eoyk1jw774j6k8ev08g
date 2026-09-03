import { type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import { EditableH1, EditableParagraph, InlineTooltip } from "@/components/atoms";

export const rollingTwoDiceBlocks: ReactElement[] = [
    <StackLayout key="layout-rolling-dice-title" maxWidth="xl">
        <Block id="rolling-dice-title" padding="md">
            <EditableH1 id="h1-rolling-dice-title" blockId="rolling-dice-title">
                Probability of Compound Events
            </EditableH1>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-rolling-dice-hook" maxWidth="xl">
        <Block id="rolling-dice-hook" padding="sm">
            <EditableParagraph id="para-rolling-dice-hook" blockId="rolling-dice-hook">
                You are one square from home, and you need a total of seven from two dice.
                Your friend needs a twelve. You both roll, and somehow you feel much better
                about your chances.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-rolling-dice-puzzle" maxWidth="xl">
        <Block id="rolling-dice-puzzle" padding="sm">
            <EditableParagraph id="para-rolling-dice-puzzle" blockId="rolling-dice-puzzle">
                You are right to. But seven is not a bigger number than twelve, and there is
                nothing special about the dice themselves. The reason sits in how many
                different ways a seven can happen.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-rolling-dice-promise" maxWidth="xl">
        <Block id="rolling-dice-promise" padding="sm">
            <EditableParagraph id="para-rolling-dice-promise" blockId="rolling-dice-promise">
                By the end of this lesson you will be able to find{" "}
                <InlineTooltip
                    id="tooltip-probability-notation"
                    tooltip="P(E) is read as the probability of the event E, a number between 0 and 1."
                >
                    P(E)
                </InlineTooltip>
                {" "}for any event E involving two dice, by listing every outcome and counting.
                You already know how to list what one die can do, write a probability as a
                fraction, and simplify it. That is all this needs.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
