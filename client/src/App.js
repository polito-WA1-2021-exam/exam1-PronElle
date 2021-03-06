import React from 'react';
import { useState, useEffect } from 'react';
import { Container, Col, Button, Toast } from 'react-bootstrap';
import { withRouter, Switch, Route, Redirect, Link } from 'react-router-dom';
// admin context
import { AdminContext } from './context/AdminContext';

// components
import NavBar from './components/NavBar';
import LoginForm from './components/LoginForm';
import  SurveyList from './components/SurveyList';
import SurveyForm from './components/SurveyForm';
import AddSurveyForm from './components/AddSurveyForm';
import AnswersSlideShow from './components/AnswersSlideShow';

// API
import API from './api/api';


function App() {
  const [surveys, setSurveys] = useState([]);
  const [questions, setQuestions] = useState([]);

  const [loggedIn, setLoggedIn] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // auth 
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await API.getUserInfo();
        setLoggedIn(true);
      } catch (err) {
        // mostly "unauthenticated user"
      }
    };
    checkAuth();
  }, []);


  // mount
  useEffect(() => {
    API.getSurveys()
        .then( survs => {
          setSurveys(survs);
          setLoading(false);
        })
        .catch(err => { 
          handleError(err);
          setLoading(false)
        });
  }, [loggedIn]);


  // add new Survey (and its questions)
  const addSurvey = async (title, _questions) => {
    try {
      const surveyid = await API.createSurvey(title);
      API.createQuestions(_questions, surveyid);
      API.getSurveys().then(survs => setSurveys(survs));
    } catch(err){
      handleError(err);
    }
  }

  /**
   * Display message using the Toast
   * @param {*} err 
   */
  const handleError = (err) => {
    setMessage(err.error);
  }

  // add  a new Reply to the db and updates the 
  // number of answerer for that specific survey
  const addReply = (reply) => {
     API.addReply(reply).catch(err => handleError(err));
  }
 
  /**
   * logs user in and sets proper states
   * @param {*} credentials 
   */
  const login = async (credentials) => {
    try {
      const user = await API.login(credentials);
      setLoggedIn(true);
      setMessage( `Welcome, ${user}!`);
    } catch (err) {
      throw err;
    }
  }

   /**
   * logs user out and clears states
   */
  const logout = async () => {
    await API.logout();
    setLoggedIn(false);
    setMessage('');
  }

  const context = {
    loggedIn: loggedIn,
    handleError: handleError,
    loading: loading
  }

  return (
    <AdminContext.Provider value={context}>
      <Container fluid>
        <NavBar logout={logout}/>
        
        <Toast className="bg-primary" show={message !== ''} onClose={() => setMessage('')} delay={5000} autohide>
          <Toast.Header>Survey-App says</Toast.Header>
          <Toast.Body>{message}</Toast.Body>
        </Toast>

        <Switch>
          <Route path="/login" render={() => {
              return loggedIn ? <Redirect to="/surveys" /> : <LoginForm login={login}/>
          }}/>

          <Route path='/surveys'>
            <Col className="text-center below-nav">
              <h1>{loggedIn ? "Your Surveys" : "Available surveys"}</h1>
              <SurveyList surveys = {surveys} />
            </Col>
            {loggedIn && <Link to="/add"><Button variant="primary" size="lg" className="fixed-right-bottom-circular">+</Button></Link>}

          </Route>

          <Route path='/survey/:id' render={ ({match}) => {
            if(!loading){
                // eslint-disable-next-line 
              const survey = surveys.find(survey => survey.id == match.params.id); 
              return !survey ? <Redirect to='/surveys'/> : 
                     loggedIn ? <AnswersSlideShow title={survey.title} surveyid={survey.id} questions={questions} setQuestions={setQuestions}/> 
                                :
                                <SurveyForm surveyid={survey.id} questions={questions} setQuestions={setQuestions} title={survey.title} addReply={addReply}/> 
            }
          }}/>

          <Route path='/add'>
            <AddSurveyForm addSurvey={addSurvey}/>
          </Route>
        
          <Route>
            <Redirect to='/surveys'/>
          </Route>

        </Switch>
      </Container>
    </AdminContext.Provider>
  );
}

export default withRouter(App);
