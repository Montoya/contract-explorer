import React, { useState } from 'react';
import Web3 from 'web3';

const App = () => {

  const [contractAddress, setContractAddress] = useState(); 
  const [contractAbi, setContractAbi] = useState(); 
  const [contractMethods, setContractMethods] = useState([]); 
  const [connected, setConnected] = useState(false); 

  // Create a new Web3 instance
  let web3 = new Web3(window.ethereum);

  const connect = async (event) => { 
    if(!window.ethereum) { 
      alert("Please install MetaMask to proceed"); 
      return; 
    }
    await window.ethereum.request({ method: 'eth_requestAccounts', params: [] });
    web3 = new Web3(window.ethereum); 
    setConnected(true); 
  }

  const takeContract = event => { 
    event.preventDefault();

    const data = new FormData(event.target); 

    const address = data.get("contract-address");

    if(!web3.utils.isAddress(address)) { return; }
    
    const abi = JSON.parse(data.get("contract-abi")); 

    const contract = new web3.eth.Contract(abi); 

    const items = []; 
    for (var i = 0; i <  contract.options.jsonInterface.length; i++) { 
      var item = contract.options.jsonInterface[i]; 
      if(item.type === "function") { 
        item.count = i; 
        item.address = address; 
        items.push(item); 
      }
    }

    setContractAddress(address); 
    setContractAbi(abi); 
    setContractMethods(items); 
  }

    // Handle the form submission
  const handleSubmit = async event => {
    event.preventDefault();

    const data = new FormData(event.target); 

    var thisMethod = {name:"",value:null,params:[]}; 
    // special inputs: method, contract, value
    for(const key of data.keys()) { 
      if(key==="methodName") { 
        thisMethod.name = data.get(key); 
      }
      else if(key==="methodType") { 
        thisMethod.type = data.get(key); 
      }
      else if(key==="etherValue") {
        thisMethod.value = data.get(key); 
      }
      else { 
        thisMethod.params.push(data.get(key)); 
      }
    }

    const contract = new web3.eth.Contract(contractAbi, contractAddress); 

    let result; 

    const addresses = await window.ethereum.request({ method: 'eth_requestAccounts', params: [] }); 
    const from = addresses[0]; 

    if(thisMethod.value !== null) { 
      result = await contract.methods[thisMethod.name](...thisMethod.params).send({from:from,value:thisMethod.value}); 
    }
    else if(thisMethod.type === "write") { 
      result = await contract.methods[thisMethod.name](...thisMethod.params).send({from:from}); 
    }
    else {
      result = await contract.methods[thisMethod.name](...thisMethod.params).call(); 
    }

    alert(result); 

  };

  // Generate a form for the write functions
  return (
    <div id="page">
      <span id="connect-button">
        {connected ? (
          <button onClick={connect} disabled>Connected</button>
        ) : (
          <button onClick={connect}>Connect</button>
        )}
      </span>
      <h1>🗺️ Contract Explorer</h1>
      <p>This is a simple contract interface for testing. It has minimal error checking. <b>Use at your own risk!</b> <em>If you make calls to a malicious contract, you can lose all your funds.</em></p>
      <form id="contract-input" onSubmit={takeContract}>
        <fieldset>
          <legend>Enter your contract address and ABI</legend>
          <div>
            <label htmlFor="contract-address">Contract Address</label>
            <input type="text" id="contract-address" name="contract-address" required />
          </div>
          <div>
            <label htmlFor="contract-abi">Contract ABI (JSON)</label>
            <textarea id="contract-abi" name="contract-abi" required></textarea>
          </div>
          <button type="submit">Parse</button>
        </fieldset>
      </form>
    {contractMethods.length > 0 && contractMethods.map(func => (
      <form id={"form-"+func.count+"-"+func.name} onSubmit={handleSubmit}>
        <fieldset>
          <legend>{func.name}</legend>
          <input type="hidden" name="methodName" value={func.name} />
          {func.inputs.length > 0 &&
            func.inputs.map(input => (
              <div>
                <label htmlFor={input.name}>{input.name}</label>
                <input type="text" id={input.name} name={input.name} required />
              </div>
            ))}
          {(func.stateMutability === 'payable' || func.payable) && (
            <div>
              <label htmlFor="etherValue">Value (ETH)</label>
              <input type="number" id="etherValue" name="etherValue" step="0.001" required />
            </div>
          )}
          {(func.stateMutability==="view" || func.constant) ? (
            <>
              <input type="hidden" name="methodType" value="read" />
              <button type="submit">Read</button>
            </>
          ) : (
            <>
              <input type="hidden" name="methodType" value="write" />
              <button type="submit">Write</button>
            </>
          )}
        </fieldset>
      </form>
    ))}
    </div>
  );
};

export default App;
