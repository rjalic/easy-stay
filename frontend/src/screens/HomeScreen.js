import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import Accommodation from '../components/Accommodation';
import Message from '../components/Message';
import Loader from '../components/Loader';
import Paginate from '../components/Paginate';
import { listAccommodations } from '../actions/accommodationActions.js';
import SearchBar from '../components/SearchBar';
import NotFound from '../components/NotFound';

const HomeScreen = ({ history }) => {
  const dispatch = useDispatch();

  const accommodationList = useSelector((state) => state.accommodationList);
  const { loading, error, accommodations, page, pages, locations } =
    accommodationList;

  let currentQuery = useLocation().search;

  function useQuery() {
    return new URLSearchParams(useLocation().search);
  }

  const query = useQuery();
  const pageNumber = query.get('page') ? query.get('page') : 1;

  useEffect(() => {
    dispatch(listAccommodations(currentQuery, pageNumber));
  }, [dispatch, currentQuery, pageNumber]);

  return (
    <>
      <h1>Stays</h1>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : (
        <>
          <Row>
            <Col sm={3}>
              <SearchBar history={history} locations={locations} />
            </Col>
            <Col sm={9}>
              {!loading && pages === 0 ? (
                <NotFound
                  message={`We couldn't find what you were looking for...`}
                  backBtn={true}
                />
              ) : (
                <Row>
                  <ul className='list-group'>
                    {accommodations.map((accommodation) => (
                      <Accommodation
                        key={accommodation._id}
                        accommodation={accommodation}
                      />
                    ))}
                  </ul>
                </Row>
              )}
              <Row className='mt-3'>
                <div className='d-flex justify-content-center'>
                  <Paginate
                    pages={pages}
                    page={page}
                    path={'/home'}
                    query={currentQuery}
                  />
                </div>
              </Row>
            </Col>
          </Row>
        </>
      )}
    </>
  );
};

export default HomeScreen;
