const { Hono } = require('hono');
const { serve } = require('@hono/node-server');

const prisma = require('../prisma');

const app = new Hono();

app.get('/', (c) => {
    return c.text("Working fine")
});

app.post('/message', async (c) => {

    try {

        const messageBody = await c.req.json();
    
        if (messageBody.userId && messageBody.message) {
    
            if (messageBody.length > 500) return c.json({message: "Message length must be less than 500 characters"}, 400);
    
            const message = await prisma.message.create({
                data: messageBody
            });
    
            return c.json(message, 201);
        }

    } catch (error) {
        console.log(error);
        return c.json({message: "Server issue"}, 500);
    }

});

app.get('/message/:id', async c => {
    try {

        const messageId = c.req.param('id');

        const message = await prisma.message.findFirst({
            where: {
                id: parseInt(messageId)
            }
        });

        if (!message) return c.json({message: "No message found for this id"}, 404);

        return c.json(message, 200);

    } catch (error) {
        console.log(error);
        return c.json({message: "Server issue"}, 500);
    }
})

app.post('/message/like', async c => {
    try {

        const body = await c.req.json();

        if (body.userId && body.messageId) {

            const messageObj = await prisma.message.findUnique({
                where: {
                    id: body.messageId
                }
            });

            if (!messageObj) return c.json({message: "No message found with the provided messageId"}, 404);

            const messageLikeObj = await prisma.messageLike.findFirst({
                where: {
                        userId: body.userId,
                        messageId: body.messageId
                    }
            });

            if (messageLikeObj) return c.json({message: "You've already liked this message"}, 400);

            const likeObj = await prisma.messageLike.create({
                data: {
                    userId: body.userId,
                    messageId: body.messageId
                }
            });

            await prisma.message.update({
                where: {
                    id: body.messageId
                },
                data: {
                    totalLikes: {increment: 1}
                }
            })

            return c.json(likeObj, 201);

        }

    } catch (error) {
        console.log(error);
        return c.json({message: "Server issue"}, 500);
    }
})

serve({
    fetch: app.fetch,
    port: 3000
});