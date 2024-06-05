import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { userService } from '../user-service'
import { cryptoUtils } from '@activepieces/server-shared'
import {
    ApId,
    assertNotNullOrUndefined,
    CreateUserRequestBody,
    EndpointScope,
    PrincipalType,
    SeekPage,
    UpdateUserRequestBody,
    User,
    UserResponse,
} from '@activepieces/shared'

export const platformUserController: FastifyPluginAsyncTypebox = async (app) => {

    app.post('/', CreateUserRequest, async (req, reply) => {
        const platformId = req.principal.platform.id
        const { firstName, lastName, email } = req.body
        assertNotNullOrUndefined(platformId, 'platformId')

        const user = await userService.create({
            password: await cryptoUtils.generateRandomPassword(),
            trackEvents: true,
            newsLetter: true,
            platformId,
            firstName,
            lastName,
            verified: true,
            email,
            platformRole: req.body.platformRole,
        })
        return reply.status(StatusCodes.CREATED).send(user)
    })

    app.get('/', ListUsersRequest, async (req) => {
        const platformId = req.principal.platform.id
        assertNotNullOrUndefined(platformId, 'platformId')

        return userService.list({
            platformId,
        })
    })

    app.post('/:id', UpdateUserRequest, async (req) => {
        const platformId = req.principal.platform.id
        assertNotNullOrUndefined(platformId, 'platformId')

        return userService.update({
            id: req.params.id,
            platformId,
            platformRole: req.body.platformRole,
            status: req.body.status,
        })
    })

    app.delete('/:id', DeleteUserRequest, async (req, res) => {
        const platformId = req.principal.platform.id
        assertNotNullOrUndefined(platformId, 'platformId')

        await userService.delete({
            id: req.params.id,
            platformId,
        })

        return res.status(StatusCodes.NO_CONTENT).send()
    })
}

const CreateUserRequest = {
    schema: {
        body: CreateUserRequestBody,
        response: {
            [StatusCodes.CREATED]: User,
        },
    },
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
}
const ListUsersRequest = {
    schema: {
        response: {
            [StatusCodes.OK]: SeekPage(UserResponse),
        },
    },
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
}

const UpdateUserRequest = {
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        body: UpdateUserRequestBody,
        response: {
            [StatusCodes.OK]: UserResponse,
        },
    },
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
}

const DeleteUserRequest = {
    schema: {
        params: Type.Object({
            id: ApId,
        }),
    },
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
}
