import React from 'react';

const About = () => {
  return (
    <div className="about-page">
      <div className="container section-padding">
        <div className="story-content" style={{ margin: '0 auto' }}>
          <div className="story-tag">
            DECADE OF OPTICAL ARTISTRY
          </div>
          <h1 className="story-heading" style={{ marginBottom: '24px', marginTop: '16px' }}>
            Clinical Excellence Meets High Fashion
          </h1>
        
          <p className="story-paragraph" style={{ marginBottom: '32px' }}>
            APlusOptics was founded with a singular purpose: to bridge the gap between clinical optical expertise and refined contemporary aesthetics. Every frame is hand-selected in Italy, while each premium lens is custom-cut in our labs to match your exact prescription parameters. We believe vision correction shouldn't hide your character — it should define it.
          </p>
          
          <div className="story-signature">
            <span className="signature-name">Ibad Ullah Khan</span>
            <div className="signature-dot"></div>
            <span className="signature-title">Founder & Chief Optician</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
