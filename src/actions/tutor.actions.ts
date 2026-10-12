"use server";

import { auth } from "@/lib/auth";
import { failure, success, type ActionResult } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { aiService } from "@/services/ai.service";
import { z } from "zod";

const chatSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().min(1).max(4000),
});

export async function sendChatMessageAction(
  input: z.infer<typeof chatSchema>
): Promise<ActionResult<{ sessionId: string; reply: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return failure("Unauthorized");

    const parsed = chatSchema.safeParse(input);
    if (!parsed.success) return failure("Invalid message");

    let chatSession = parsed.data.sessionId
      ? await prisma.chatSession.findFirst({
          where: { id: parsed.data.sessionId, userId: session.user.id },
          include: { messages: { orderBy: { createdAt: "asc" } } },
        })
      : null;

    if (!chatSession) {
      chatSession = await prisma.chatSession.create({
        data: {
          userId: session.user.id,
          title: parsed.data.message.slice(0, 50),
          messages: {
            create: { role: "user", content: parsed.data.message },
          },
        },
        include: { messages: true },
      });
    } else {
      await prisma.chatMessage.create({
        data: {
          sessionId: chatSession.id,
          role: "user",
          content: parsed.data.message,
        },
      });
    }

    const history = chatSession.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const reply = await aiService.chat(parsed.data.message, history);

    await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: "assistant",
        content: reply,
      },
    });

    return success({ sessionId: chatSession.id, reply });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Chat failed");
  }
}

export async function getChatSessionsAction(): Promise<
  ActionResult<Array<{ id: string; title: string; updatedAt: Date }>>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) return failure("Unauthorized");

    const sessions = await prisma.chatSession.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true },
    });

    return success(sessions);
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Failed to fetch sessions");
  }
}

export async function getChatMessagesAction(
  sessionId: string
): Promise<ActionResult<Array<{ id: string; role: string; content: string; createdAt: Date }>>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return failure("Unauthorized");

    const chatSession = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId: session.user.id },
    });
    if (!chatSession) return failure("Session not found");

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });

    return success(messages);
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Failed to fetch messages");
  }
}
