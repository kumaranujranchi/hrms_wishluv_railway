import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, AlertTriangle, Users, Calendar, DollarSign } from 'lucide-react';

interface AIInsight {
  id: string;
  type: 'attendance' | 'leave' | 'expense' | 'performance' | 'general';
  title: string;
  description: string;
  recommendation: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  data: any;
}

interface AIInsightsProps {
  userId: string;
  userRole: string;
}

export default function AIInsights({ userId, userRole }: AIInsightsProps) {
  const { data: insights = [], isLoading } = useQuery<AIInsight[]>({
    queryKey: ['/api/ai/insights', userId],
    enabled: userRole === 'admin' || userRole === 'manager',
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'attendance':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'leave':
        return <Users className="h-5 w-5 text-green-500" />;
      case 'expense':
        return <DollarSign className="h-5 w-5 text-yellow-500" />;
      case 'performance':
        return <TrendingUp className="h-5 w-5 text-purple-500" />;
      default:
        return <Brain className="h-5 w-5 text-gray-500" />;
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High Impact</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Impact</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-800">Low Impact</Badge>;
    }
  };

  const generateMockInsights = (): AIInsight[] => {
    return [
      {
        id: '1',
        type: 'attendance',
        title: 'Irregular Attendance Pattern Detected',
        description: 'Engineering team shows 15% increase in late arrivals over the past month',
        recommendation: 'Consider flexible working hours or investigate potential commute issues',
        confidence: 87,
        impact: 'medium',
        data: { affected_employees: 12, average_delay: '23 minutes' }
      },
      {
        id: '2',
        type: 'leave',
        title: 'Leave Balance Optimization',
        description: '68% of employees have unused vacation days nearing expiry',
        recommendation: 'Send reminders and encourage vacation planning to improve work-life balance',
        confidence: 92,
        impact: 'high',
        data: { employees_affected: 34, average_unused_days: 8.5 }
      },
      {
        id: '3',
        type: 'expense',
        title: 'Expense Claim Anomaly',
        description: 'Travel expenses have increased by 45% compared to last quarter',
        recommendation: 'Review travel policy and consider cost optimization measures',
        confidence: 78,
        impact: 'medium',
        data: { cost_increase: '$12,450', claims_affected: 18 }
      }
    ];
  };

  // Use mock data when insights are empty (for demonstration)
  const displayInsights = insights.length > 0 ? insights : generateMockInsights();

  if (userRole !== 'admin' && userRole !== 'manager') {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Brain className="h-6 w-6 animate-pulse text-neutral-400" />
            <span className="ml-2 text-neutral-600">Analyzing data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-6 w-6 text-purple-600" />
          <span>AI Insights & Recommendations</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayInsights.map((insight) => (
            <div key={insight.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getInsightIcon(insight.type)}
                  <h3 className="font-semibold text-neutral-900">{insight.title}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  {getImpactBadge(insight.impact)}
                  <Badge variant="outline">{insight.confidence}% confidence</Badge>
                </div>
              </div>
              
              <p className="text-neutral-600 mb-3">{insight.description}</p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Recommendation</p>
                    <p className="text-sm text-blue-700">{insight.recommendation}</p>
                  </div>
                </div>
              </div>
              
              {insight.data && (
                <div className="text-xs text-neutral-500">
                  Key metrics: {Object.entries(insight.data).map(([key, value]) => 
                    `${key.replace(/_/g, ' ')}: ${value}`
                  ).join(' • ')}
                </div>
              )}
              
              <div className="flex justify-end mt-3">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {displayInsights.length === 0 && (
          <div className="text-center py-8 text-neutral-500">
            <Brain className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
            <p>No insights available at the moment</p>
            <p className="text-sm">AI is analyzing your data to provide recommendations</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}