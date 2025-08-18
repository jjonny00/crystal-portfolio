const styles = {
  title: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center'
  },
  titleIcon: {
    marginRight: '8px'
  },
  toggleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    padding: '10px',
    borderRadius: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    transition: 'background-color 0.3s ease'
  },
  toggleLabel: {
    fontSize: '14px',
    fontWeight: '500'
  },
  controlToggle: {
    position: 'relative',
    width: '40px',
    height: '20px',
    display: 'inline-block'
  },
  toggleSwitchInput: {
    opacity: 0,
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    margin: 0,
    cursor: 'inherit'
  },
  toggleSwitchTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '20px',
    transition: 'background-color 0.3s'
  },
  toggleSwitchThumb: {
    position: 'absolute',
    top: '2px',
    width: '16px',
    height: '16px',
    backgroundColor: 'white',
    borderRadius: '50%',
    transition: 'left 0.3s'
  },
  radioContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '15px'
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '5px'
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  sliderGroup: {
    marginBottom: '15px',
    padding: '10px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)'
  },
  sliderLabel: {
    fontSize: '12px',
    marginBottom: '5px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  slider: {
    width: '100%',
    backgroundColor: 'transparent',
    accentColor: '#64ffda'
  },
  infoText: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: '15px',
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
    padding: '10px',
    borderRadius: '8px',
    lineHeight: '1.4'
  },
  infoParagraph: {
    marginTop: '8px'
  },
  debugButton: {
    marginTop: '10px',
    width: '100%',
    color: '#000',
    border: 'none',
    padding: '8px',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};

export default styles;
