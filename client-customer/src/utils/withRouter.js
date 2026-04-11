import { useLocation, useNavigate, useParams } from 'react-router-dom';

function withRouter(Component) {
  return function (props) {
    const navigate = useNavigate();
    const params = useParams();
    const location = useLocation();

    return <Component {...props} navigate={navigate} params={params} location={location} />;
  };
}

export default withRouter;
