// @flow
import React from 'react'
import type {Location, Match, RouterHistory} from 'react-router-dom'
import {withRouter} from 'react-router-dom'
import ErrorComponent from 'universal/components/ErrorComponent/ErrorComponent'
import LoadingView from 'universal/components/LoadingView/LoadingView'
import QueryRenderer from 'universal/components/QueryRenderer/QueryRenderer'
import RelayTransitionGroup from 'universal/components/RelayTransitionGroup'
import withAtmosphere from 'universal/decorators/withAtmosphere/withAtmosphere'
import UserSettingsContainer from 'universal/modules/userDashboard/containers/UserSettings/UserSettingsContainer'
import NotificationSubscription from 'universal/subscriptions/NotificationSubscription'
import {cacheConfig} from 'universal/utils/constants'
import type {Dispatch} from 'react-redux'
import {connect} from 'react-redux'

const query = graphql`
  query UserSettingsRootQuery {
    viewer {
      ...UserSettingsContainer_viewer
    }
  }
`

const subscriptions = [NotificationSubscription]

type Props = {
  atmosphere: Object,
  dispatch: Dispatch<*>,
  history: RouterHistory,
  location: Location,
  match: Match
}

const UserSettingsRoot = (props: Props) => {
  const {
    atmosphere,
    dispatch,
    history,
    location,
    match: {
      params: {teamId}
    }
  } = props
  return (
    <QueryRenderer
      cacheConfig={cacheConfig}
      environment={atmosphere}
      query={query}
      variables={{teamId}}
      subscriptions={subscriptions}
      subParams={{dispatch, history, location}}
      render={(readyState) => (
        <RelayTransitionGroup
          readyState={readyState}
          error={<ErrorComponent height={'14rem'} />}
          loading={<LoadingView minHeight='50vh' />}
          ready={<UserSettingsContainer />}
        />
      )}
    />
  )
}

export default connect()(withRouter(withAtmosphere(UserSettingsRoot)))
