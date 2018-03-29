import React from 'react';
import axios from 'axios';;
import VoterResults from './VoterResults.jsx';
import { Divider, Card, RaisedButton, Checkbox, RadioButton, RadioButtonGroup } from 'material-ui';
import { Button } from 'semantic-ui-react';
import Loadable from 'react-loading-overlay';
import '../style/voter.css';

class Vote extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoggedIn: false,
      storageValue: 0,
      voteHash: '',
      pollHash: '',
      isVoteSubmitted: false,
      isBallotCompleted: false,
      selectedOption: '',
      candidateName: '',
      ballotName: '',
      ballotOption: [],
      loaderActive: false
    };
    this.updateCheck = this.updateCheck.bind(this);
    this.submitVote = this.submitVote.bind(this);
  }

  componentWillMount() {
    var option = this;
    axios({
      method: 'POST',
      url: '/api/poll',
      data: { 
        pollId: this.props.pollId
      }
    })
    .then((res) => {
      var options = res.data.map(function(element) {
        return element
      });
      var name = res.data[0].poll.pollName;
      option.setState({
        ballotName: name,
        ballotOption: options,
        selectedOption: options[0].id
      });
    })
    .catch((error) => {
      voter.setState({
        errorText: "Your unique code is incorrect. Please, try again"
      });
    });
  }

  updateCheck(event) {
    var eventValue = event.target.value.split('.')
    this.setState({
      selectedOption: eventValue[0],
      candidateName: eventValue[1]
    });
  }

  submitVote(event) {
    event.preventDefault();
    var voted = this;
    voted.setState({
      loaderActive: true
    });
    axios.post('/blockchainvote', {
      address: voted.props.pollHash,
      candidate: voted.state.candidateName
    })
    .then(res => {
      console.log(`Vote tx hash: ${res.data}`);
      voted.setState({
        voteHash: res.data
      });
      return axios.post('/api/voteresult', {
        voted: Number(voted.state.selectedOption),
        voteHash: res.data
      });
    })
    .then(res => {
      console.log(res)
      console.log('vote has been submitted')
      voted.setState({
        loaderActive: false,
        isVoteSubmitted: true
      });
    })
    .catch(error => {
      voted.setState({
        loaderActive: false
      });
      console.log(error);
    });
  }

  render() {
    let ballotInfo = this.state;
    let ballotQuestionList = ballotInfo.ballotOption.map((option, index) => {
      return (
          <RadioButton
            iconStyle={{ fill:'#4183D9' }}
            key={index}
            label={option.optionName}
            value={`${option.id}.${option.optionName}`}
          />
      )
    });
    
    if(this.state.isVoteSubmitted === true) {
      return (
        <VoterResults
          ballotOption={this.state.ballotOption}
          ballotName={this.state.ballotName}
          voteHash={this.state.voteHash}
          pollEnd={this.props.pollEnd}
        />
      )
    } else {
      return (
        <div>
          <div className='header'>{ballotInfo.ballotName}</div>
          <form>
              <Card className='ballotOptions'>
                <div>
                  <RadioButtonGroup
                    name="voteoptions"
                    labelPosition="left"
                    valueSelected={this.state.selectedOption + "." + this.state.candidateName}
                    onChange={this.updateCheck}
                  >
                    {ballotQuestionList}
                  </RadioButtonGroup>
                </div>
                <br/>
                <Loadable
                  active={this.state.loaderActive}
                  spinnerSize='35px'
                  spinner
                >
                <Button
                  fluid
                  primary
                  className='blueMatch'
                  className='buttonStyle'
                  className='voteButton'
                  onClick={this.submitVote}
                >
                  Vote
                </Button>
                </Loadable>
              </Card>
          </form>
        </div>
      )
    }
  }
}

export default Vote;