export default function Home() {
  return (
    <>
      <div
        className="hero"
        style={{
          backgroundImage: 'url(/santorini-karens-70th.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center top',
          backgroundColor: '#1a4d6d',
          minHeight: 420,
          borderRadius: '0 0 24px 24px',
          margin: '-24px -24px 24px -24px',
        }}
      />
      <div className="card">
        <h2 className="sectionLabel">Welcome</h2>
        <p style={{ margin: 0, lineHeight: 1.5 }}>
          Everything you need for our family trip: schedule, travel details, and the guest list. Use the tabs above to explore.
        </p>
      </div>
      <div className="card">
        <h3 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#5c5c5c' }}>Quick links</h3>
        <p style={{ margin: '4px 0' }}>📅 Schedule — calendar & daily plans</p>
        <p style={{ margin: '4px 0' }}>✈️ Travel — flights, Santorini/Crete stay, transfers</p>
        <p style={{ margin: '4px 0' }}>👨‍👩‍👧‍👦 Guests — who's coming</p>
        <p style={{ margin: '4px 0' }}>📄 Import — paste or choose a PDF or image to fill trip data</p>
      </div>
    </>
  );
}
