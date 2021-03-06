import {GraphQLID, GraphQLNonNull} from 'graphql'
import {fromGlobalId} from 'graphql-relay'
import getRethink from 'server/database/rethinkDriver'
import RemoveSlackChannelPayload from 'server/graphql/types/RemoveSlackChannelPayload'
import getPubSub from 'server/utils/getPubSub'
import {SLACK} from 'universal/utils/constants'
import {isTeamMember} from 'server/utils/authorization'
import {sendTeamAccessError} from 'server/utils/authorizationErrors'
import {sendSlackProviderNotFoundError} from 'server/utils/docNotFoundErrors'
import {sendAlreadyRemovedIntegrationError} from 'server/utils/alreadyMutatedErrors'

export default {
  name: 'RemoveSlackChannel',
  description: 'Remove a slack channel integration from a team',
  type: new GraphQLNonNull(RemoveSlackChannelPayload),
  args: {
    slackGlobalId: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  resolve: async (source, {slackGlobalId}, {authToken, socketId: mutatorId}) => {
    const r = getRethink()
    const {id} = fromGlobalId(slackGlobalId)
    // AUTH
    const integration = await r.table(SLACK).get(id)
    if (!integration) {
      return sendSlackProviderNotFoundError(authToken, {
        globalId: slackGlobalId
      })
    }
    const {teamId, isActive} = integration
    if (!isTeamMember(authToken, teamId)) {
      return sendTeamAccessError(authToken, teamId)
    }

    // VALIDATION
    if (!isActive) {
      return sendAlreadyRemovedIntegrationError(authToken, slackGlobalId)
    }
    // RESOLUTION

    await r
      .table(SLACK)
      .get(id)
      .update({
        isActive: false
      })
    const slackChannelRemoved = {
      deletedId: slackGlobalId
    }
    getPubSub().publish(`slackChannelRemoved.${teamId}`, {
      slackChannelRemoved,
      mutatorId
    })
    return slackChannelRemoved
  }
}
