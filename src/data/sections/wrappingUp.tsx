import { type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import { EditableH2, EditableParagraph, InlineFormula } from "@/components/atoms";

export const wrappingUpBlocks: ReactElement[] = [
    <StackLayout key="layout-wrapping-up-heading" maxWidth="xl">
        <Block id="wrapping-up-heading" padding="md">
            <EditableH2 id="h2-wrapping-up-heading" blockId="wrapping-up-heading">
                Summary
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-wrapping-up-promise-kept" maxWidth="xl">
        <Block id="wrapping-up-promise-kept" padding="sm">
            <EditableParagraph id="para-wrapping-up-promise-kept" blockId="wrapping-up-promise-kept">
                So a seven was never luckier than a twelve. As an event it contains six of the
                thirty-six outcomes while a twelve contains one, and with the whole sample
                space in front of you, that is something you can see rather than trust.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-wrapping-up-takeaway" maxWidth="xl">
        <Block id="wrapping-up-takeaway" padding="sm">
            <EditableParagraph id="para-wrapping-up-takeaway" blockId="wrapping-up-takeaway">
                The whole lesson rests on one statement:{" "}
                <InlineFormula
                    latex="P(\clr{event}{E}) = \frac{\clr{event}{|E|}}{\clr{space}{|S|}}"
                    colorMap={{ event: '#62D0AD', space: '#475569' }}
                />
                , valid whenever the outcomes in S are equally likely. List the sample space,
                count the outcomes your event contains, divide. It holds for two dice, for a
                coin and a die, for a spinner and a card.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-wrapping-up-next" maxWidth="xl">
        <Block id="wrapping-up-next" padding="sm">
            <EditableParagraph id="para-wrapping-up-next" blockId="wrapping-up-next">
                Later you will meet events with far too many outcomes to draw, and pairs of
                events where the first result changes the second. Tree diagrams take over
                there, but the counting idea underneath stays exactly the same.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
